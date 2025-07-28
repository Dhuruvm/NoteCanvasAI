import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { summarizeContentWithGemini } from "./services/gemini";
import { generateNotePDF, extractTextFromPDF } from "./services/pdf";
import { generateAdvancedPDF } from "./services/advanced-pdf";
import { generateEnhancedPDF } from "./services/pdf-generator";
import { processWithMultipleModels } from "./services/multi-model-ai";
import { chatAIService } from "./services/chat-ai";
import { 
  insertNoteSchema, insertTemplateSchema, insertChatSessionSchema, 
  insertChatMessageSchema, type AISettings, type ChatContext 
} from "@shared/schema";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  },
});

const processContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  settings: z.object({
    summaryStyle: z.enum(["academic", "bulletPoints", "mindMap", "qna"]).default("academic"),
    detailLevel: z.number().min(1).max(5).default(3),
    includeExamples: z.boolean().default(true),
    useMultipleModels: z.boolean().default(false),
    designStyle: z.enum(["academic", "modern", "minimal", "colorful"]).default("modern"),
  }).default({}),
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check endpoint for deployment platforms
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      port: process.env.PORT || "5000",
      env: process.env.NODE_ENV || "development"
    });
  });

  // Upload and process PDF
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let content: string;

      try {
        if (req.file.mimetype === 'application/pdf') {
          console.log(`Processing PDF file: ${req.file.originalname}, size: ${req.file.buffer.length} bytes`);
          content = await extractTextFromPDF(req.file.buffer);
          console.log(`PDF text extraction successful, extracted ${content.length} characters`);
        } else {
          content = req.file.buffer.toString('utf-8');
          console.log(`Text file processed: ${content.length} characters`);
        }
      } catch (extractionError) {
        console.error(`File extraction failed for ${req.file.originalname}:`, extractionError);
        return res.status(400).json({ 
          message: `Failed to process ${req.file.mimetype === 'application/pdf' ? 'PDF' : 'text'} file: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`,
          details: extractionError instanceof Error ? extractionError.message : 'Unknown error'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "No readable content found in the uploaded file" });
      }

      // Create initial note
      const note = await storage.createNote({
        title: req.file.originalname.replace(/\.[^/.]+$/, ""), // Remove file extension
        originalContent: content,
        templateId: req.body.templateId || "academic",
      });

      // Process in background for uploaded files too
      processContentInBackground(note.id, content, { 
        summaryStyle: req.body.templateId || "academic",
        detailLevel: 3,
        includeExamples: true 
      }, req.file.mimetype === 'application/pdf' ? req.file.buffer : undefined);

      res.json({ noteId: note.id, message: "File uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  // Process content with AI
  app.post("/api/process", async (req, res) => {
    try {
      const { content, settings } = processContentSchema.parse(req.body);

      // Create initial note
      const note = await storage.createNote({
        title: "Generated Notes",
        originalContent: content,
        templateId: settings.summaryStyle,
      });

      // Process in background
      processContentInBackground(note.id, content, settings);

      res.json({ noteId: note.id, message: "Processing started" });
    } catch (error) {
      console.error("Process error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Processing failed" });
    }
  });

  // Get note by ID
  app.get("/api/notes/:id", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNote(noteId);

      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.json(note);
    } catch (error) {
      console.error("Get note error:", error);
      res.status(500).json({ message: "Failed to retrieve note" });
    }
  });

  // Get all notes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getAllNotes();
      res.json(notes);
    } catch (error) {
      console.error("Get notes error:", error);
      res.status(500).json({ message: "Failed to retrieve notes" });
    }
  });

  // Generate PDF endpoint with multi-model AI
  app.post("/api/notes/:id/generate-pdf", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }
      const note = await storage.getNote(noteId);

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      console.log(`Generating enhanced PDF for note ${noteId}: ${note.title}`);

      // Enhanced options with multi-model AI processing
      const options = {
        designStyle: (req.body.designStyle as any) || "modern",
        colorScheme: req.body.colorScheme || "blue",
        includeVisualElements: req.body.includeVisualElements !== false,
        includeCharts: req.body.includeCharts !== false,
        includeInfographic: req.body.includeInfographic !== false,
        useEnhancedLayout: req.body.useEnhancedLayout !== false,
        fontSize: req.body.fontSize || 12,
        fontFamily: req.body.fontFamily || "helvetica",
        spacing: req.body.spacing || 1.5,
        includeHeader: req.body.includeHeader !== false,
        includeFooter: req.body.includeFooter !== false,
        margins: req.body.margins || 60,
        multiModelProcessing: req.body.multiModelProcessing !== false,
        pageMargins: req.body.pageMargins || {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60
        }
      };

      // Cast note to ProcessedNote with required properties
      const processedContent = note.processedContent as any || {};
      const processedNote = {
        ...note,
        keyConcepts: processedContent.keyConcepts || [],
        summaryPoints: processedContent.summaryPoints || [],
        processFlow: processedContent.processFlow || [],
        enhancedContent: processedContent.enhancedContent || '',
        metadata: processedContent.metadata || { aiModelsUsed: ['Multi-Model AI'] }
      } as any;

      // Use enhanced PDF generator with multi-model AI
      const pdfResult = await generateEnhancedPDF(
        note,
        note.originalContent || '',
        {
          designStyle: options.designStyle,
          includeVisualElements: options.includeVisualElements,
          useEnhancedLayout: options.useEnhancedLayout,
          colorScheme: options.colorScheme
        }
      );
      
      const pdfBuffer = Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
      const metadata = (pdfResult as any).metadata || {};

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty");
      }

      // Validate PDF header
      const pdfHeader = pdfBuffer.subarray(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        throw new Error("Generated file is not a valid PDF");
      }

      console.log(`Enhanced PDF generated successfully:`, metadata);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
      res.setHeader('X-PDF-Metadata', JSON.stringify(metadata));
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Enhanced PDF generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate enhanced PDF",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auto-generate PDF endpoint
  app.post("/api/notes/:id/auto-generate-pdf", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }
      const note = await storage.getNote(noteId);

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      console.log(`Auto-generating PDF for note ${noteId}: ${note.title}`);

      // Auto-detect optimal settings based on content
      const autoOptions = {
        designStyle: "modern" as const,
        colorScheme: "blue",
        includeVisualElements: true,
        includeCharts: true,
        includeInfographic: true,
        useEnhancedLayout: true,
        fontSize: 12,
        fontFamily: "helvetica" as const,
        spacing: 1.5,
        includeHeader: true,
        includeFooter: true,
        margins: 60,
        multiModelProcessing: true,
        pageMargins: { top: 60, right: 60, bottom: 60, left: 60 }
      };

      const pdfResult = await generateAdvancedPDF(
        note.processedContent as any,
        JSON.stringify(autoOptions)
      );
      
      const pdfBuffer = Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
      const metadata = (pdfResult as any).metadata || {};

      console.log(`Auto-generated PDF completed:`, metadata);

      res.json({
        success: true,
        metadata,
        downloadUrl: `/api/notes/${noteId}/download-pdf`,
        message: "PDF auto-generated successfully with multi-model AI"
      });

    } catch (error) {
      console.error("Auto PDF generation error:", error);
      res.status(500).json({ 
        error: "Failed to auto-generate PDF",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate basic PDF for a note (fallback)
  app.get("/api/notes/:id/pdf", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);

      if (isNaN(noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
      }

      const note = await storage.getNote(noteId);

      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      if (note.status !== "completed") {
        return res.status(400).json({ message: "Note processing not completed" });
      }

      if (!note.processedContent) {
        return res.status(400).json({ message: "No processed content available for PDF generation" });
      }

      console.log(`Generating basic PDF for note ${noteId}: ${note.title}`);

      const pdfBuffer = await generateNotePDF(note.processedContent as any, {
        theme: (req.query.theme as any) || "modern",
        fontSize: parseInt(req.query.fontSize as string) || 12,
        includeHeader: req.query.includeHeader !== "false",
        includeFooter: req.query.includeFooter !== "false",
        colorScheme: (req.query.colorScheme as any) || "blue",
      });

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty");
      }

      console.log(`Basic PDF generated successfully, size: ${pdfBuffer.length} bytes`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.title || 'notes')}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Failed to retrieve templates" });
    }
  });

  // Create custom template
  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Create template error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // ============= CHAT WITH PDF ROUTES =============

  // Create a new chat session for a note
  app.post("/api/notes/:noteId/chat", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      const { userId = "anonymous", difficulty = "intermediate", subject } = req.body;

      // Create chat session
      const session = await storage.createChatSession({
        noteId,
        userId,
        title: `Chat: ${note.title}`,
        difficulty,
        subject: subject || "General Study"
      });

      // Generate predicted questions in background
      if (note.processedContent && typeof note.processedContent === 'object') {
        const content = note.originalContent;
        try {
          const predictions = await chatAIService.predictImportantQuestions(
            content, 
            subject, 
            difficulty
          );
          
          // Store predicted questions
          for (const prediction of predictions) {
            await storage.createPredictedQuestion({
              noteId,
              question: prediction.question,
              answer: prediction.answer,
              difficulty: prediction.difficulty,
              topic: prediction.topic,
              importance: prediction.importance,
              sources: prediction.sources || []
            });
          }
          
          console.log(`Generated ${predictions.length} predicted questions for note ${noteId}`);
        } catch (error) {
          console.error("Failed to generate predicted questions:", error);
        }
      }

      // Create welcome message
      await storage.createChatMessage({
        sessionId: session.id,
        role: "assistant",
        content: `Hello! I'm here to help you understand "${note.title}". I can answer questions, explain concepts, and quiz you on the content. What would you like to explore first?`,
        messageType: "text",
        metadata: { isWelcome: true }
      });

      res.json(session);
    } catch (error) {
      console.error("Create chat session error:", error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  // Get chat sessions for a note
  app.get("/api/notes/:noteId/chat", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const sessions = await storage.getChatSessionsByNote(noteId);
      res.json(sessions);
    } catch (error) {
      console.error("Get chat sessions error:", error);
      res.status(500).json({ error: "Failed to retrieve chat sessions" });
    }
  });

  // Send message in chat session
  app.post("/api/chat/:sessionId/message", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const { content, userId = "anonymous" } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      const note = await storage.getNote(session.noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        sessionId,
        role: "user",
        content: content.trim(),
        messageType: "text"
      });

      // Get chat history and user progress
      const chatHistory = await storage.getRecentChatMessages(sessionId, 10);
      
      let userProgress = await storage.getUserProgress(userId, sessionId);
      if (!userProgress) {
        userProgress = await storage.createUserProgress({
          userId,
          sessionId,
          totalQuestions: 0,
          correctAnswers: 0,
          currentStreak: 0,
          bestStreak: 0,
          points: 0,
          level: 1,
          badges: [],
          penalties: 0
        });
      }

      // Build context
      const previousMessages = chatHistory.filter(msg => msg.messageType === "question");
      const previousQuestions = previousMessages.map(msg => msg.content);

      const context: ChatContext = {
        noteContent: note.originalContent,
        currentTopic: session.subject || "General",
        userLevel: session.difficulty,
        previousQuestions,
        userProgress: {
          correctAnswers: userProgress.correctAnswers,
          totalQuestions: userProgress.totalQuestions,
          currentStreak: userProgress.currentStreak,
          points: userProgress.points,
          level: userProgress.level
        }
      };

      // Generate AI response
      const aiResponse = await chatAIService.generateResponse(
        content.trim(),
        context,
        chatHistory
      );

      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        sessionId,
        role: "assistant",
        content: aiResponse.response,
        messageType: aiResponse.messageType,
        metadata: aiResponse.metadata
      });

      res.json({
        userMessage,
        assistantMessage,
        context: {
          currentStreak: userProgress.currentStreak,
          points: userProgress.points,
          level: userProgress.level
        }
      });

    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Get messages for a chat session
  app.get("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const messages = await storage.getChatMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });

  // Generate quiz question
  app.post("/api/chat/:sessionId/quiz", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const { userId = "anonymous" } = req.body;

      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      const note = await storage.getNote(session.noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Get user progress
      let userProgress = await storage.getUserProgress(userId, sessionId);
      if (!userProgress) {
        userProgress = await storage.createUserProgress({
          userId,
          sessionId,
          totalQuestions: 0,
          correctAnswers: 0,
          currentStreak: 0,
          bestStreak: 0,
          points: 0,
          level: 1,
          badges: [],
          penalties: 0
        });
      }

      // Get previous questions
      const chatHistory = await storage.getRecentChatMessages(sessionId, 20);
      const previousQuestions = chatHistory
        .filter(msg => msg.messageType === "quiz")
        .map(msg => msg.content);

      // Build context
      const context: ChatContext = {
        noteContent: note.originalContent,
        currentTopic: session.subject || "General",
        userLevel: session.difficulty,
        previousQuestions,
        userProgress: {
          correctAnswers: userProgress.correctAnswers,
          totalQuestions: userProgress.totalQuestions,
          currentStreak: userProgress.currentStreak,
          points: userProgress.points,
          level: userProgress.level
        }
      };

      // Generate quiz question
      const quiz = await chatAIService.generateQuizQuestion(context, previousQuestions);

      // Save quiz question
      await storage.createChatMessage({
        sessionId,
        role: "assistant",
        content: quiz.question,
        messageType: "quiz",
        metadata: {
          options: quiz.options,
          correctAnswer: quiz.correctAnswer,
          explanation: quiz.explanation,
          difficulty: quiz.difficulty,
          topic: quiz.topic
        }
      });

      res.json(quiz);

    } catch (error) {
      console.error("Generate quiz error:", error);
      res.status(500).json({ error: "Failed to generate quiz question" });
    }
  });

  // Submit quiz answer
  app.post("/api/chat/:sessionId/quiz/answer", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const { answer, correctAnswer, difficulty, timeTaken, userId = "anonymous" } = req.body;

      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      // Get current progress
      let userProgress = await storage.getUserProgress(userId, sessionId);
      if (!userProgress) {
        userProgress = await storage.createUserProgress({
          userId,
          sessionId,
          totalQuestions: 0,
          correctAnswers: 0,
          currentStreak: 0,
          bestStreak: 0,
          points: 0,
          level: 1,
          badges: [],
          penalties: 0
        });
      }

      const isCorrect = answer === correctAnswer;
      
      // Calculate rewards
      const rewards = chatAIService.calculateRewards(
        isCorrect,
        difficulty || "medium",
        userProgress.currentStreak,
        timeTaken || 60,
        userProgress.level
      );

      // Update progress
      const newStreak = isCorrect ? userProgress.currentStreak + 1 : 0;
      const newPoints = Math.max(0, userProgress.points + rewards.pointsEarned - rewards.penalties);
      const newLevel = rewards.levelUp ? userProgress.level + 1 : userProgress.level;
      const newBestStreak = Math.max(userProgress.bestStreak, newStreak);

      const updatedProgress = await storage.updateUserProgress(userId, sessionId, {
        totalQuestions: userProgress.totalQuestions + 1,
        correctAnswers: isCorrect ? userProgress.correctAnswers + 1 : userProgress.correctAnswers,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        points: newPoints,
        level: newLevel,
        badges: [...(userProgress.badges as string[] || []), ...rewards.newBadges],
        penalties: userProgress.penalties + rewards.penalties
      });

      // Save user answer
      await storage.createChatMessage({
        sessionId,
        role: "user",
        content: answer,
        messageType: "answer",
        metadata: { 
          isCorrect, 
          timeTaken,
          pointsEarned: rewards.pointsEarned,
          penalties: rewards.penalties
        }
      });

      res.json({
        isCorrect,
        rewards,
        progress: updatedProgress,
        encouragement: rewards.encouragement
      });

    } catch (error) {
      console.error("Submit quiz answer error:", error);
      res.status(500).json({ error: "Failed to submit quiz answer" });
    }
  });

  // Get user progress
  app.get("/api/chat/:sessionId/progress/:userId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.params.userId;

      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const progress = await storage.getUserProgress(userId, sessionId);
      if (!progress) {
        // Return default progress
        return res.json({
          totalQuestions: 0,
          correctAnswers: 0,
          currentStreak: 0,
          bestStreak: 0,
          points: 0,
          level: 1,
          badges: [],
          penalties: 0
        });
      }

      res.json(progress);
    } catch (error) {
      console.error("Get progress error:", error);
      res.status(500).json({ error: "Failed to retrieve progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processContentInBackground(noteId: number, content: string, settings: AISettings, pdfBuffer?: Buffer) {
  try {
    // Update status to processing
    await storage.updateNoteStatus(noteId, "processing");
    console.log(`Starting AI processing for note ${noteId}, content length: ${content.length} chars`);

    // Process content with Gemini AI
    const processingPromise = summarizeContentWithGemini(content, settings, pdfBuffer);

    // Add timeout to prevent hanging (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI processing timeout after 30 seconds')), 30000);
    });

    const processedContent = await Promise.race([processingPromise, timeoutPromise]);

    // Update note with processed content
    await storage.updateNoteContent(noteId, processedContent);

    console.log(`Successfully processed note ${noteId}`);
  } catch (error) {
    console.error(`Failed to process note ${noteId}:`, error);

    // Create fallback content for failed processing
    const fallbackContent = {
      title: content.substring(0, 50) + "...",
      keyConcepts: [
        {
          title: "Processing Error",
          definition: error instanceof Error ? error.message : "AI processing failed"
        }
      ],
      summaryPoints: [
        {
          heading: "Original Content",
          points: [content.length > 500 ? content.substring(0, 500) + "..." : content]
        }
      ],
      processFlow: [],
      metadata: {
        source: "error_fallback",
        generatedAt: new Date().toISOString(),
        style: settings.summaryStyle || "academic",
        aiModelsUsed: ["fallback"]
      }
    };

    await storage.updateNoteContent(noteId, fallbackContent);
    await storage.updateNoteStatus(noteId, "failed");
  }
}