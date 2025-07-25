import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { summarizeContentWithGemini } from "./services/gemini";
import { generateNotePDF, extractTextFromPDF } from "./services/pdf";
import { generateAdvancedPDF } from "./services/advanced-pdf";
import { enhanceContentWithMultiModel, processWithMultipleModels } from "./services/multi-model-ai";
import { insertNoteSchema, insertTemplateSchema, type AISettings } from "@shared/schema";
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

  // Generate advanced PDF for a note with multiple AI models
  app.post("/api/notes/:id/generate-pdf", async (req, res) => {
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

      console.log(`Generating advanced PDF for note ${noteId}: ${note.title}`);

      // Use advanced PDF generation with multiple AI models
      const options = {
        designStyle: (req.body.designStyle as any) || "modern",
        includeVisualElements: req.body.includeVisualElements !== false,
        useEnhancedLayout: req.body.useEnhancedLayout !== false,
        colorScheme: req.body.colorScheme || "blue"
      };

      const pdfBuffer = await generateAdvancedPDF(
        note.processedContent as any,
        note.originalContent,
        options
      );

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("Generated PDF buffer is empty");
      }

      // Validate PDF header
      const pdfHeader = pdfBuffer.subarray(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        throw new Error("Generated file is not a valid PDF");
      }

      console.log(`Advanced PDF generated successfully, size: ${pdfBuffer.length} bytes`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.title || 'enhanced-notes')}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Advanced PDF generation error:", error);
      res.status(500).json({ message: `Failed to generate advanced PDF: ${error instanceof Error ? error.message : 'Unknown error'}` });
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