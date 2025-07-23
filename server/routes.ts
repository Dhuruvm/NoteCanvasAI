import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { summarizeContentWithGemini } from "./services/gemini";
import { generateNotePDF, extractTextFromPDF } from "./services/pdf";
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
        } else {
          content = req.file.buffer.toString('utf-8');
        }
      } catch (extractionError) {
        console.error(`File extraction failed for ${req.file.originalname}:`, extractionError);
        return res.status(400).json({ 
          message: `Failed to process ${req.file.mimetype === 'application/pdf' ? 'PDF' : 'text'} file: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}` 
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
      });

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

  // Generate PDF for a note
  app.get("/api/notes/:id/pdf", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      if (note.status !== "completed") {
        return res.status(400).json({ message: "Note processing not completed" });
      }

      const pdfBuffer = await generateNotePDF(note.processedContent as any, {
        theme: req.query.theme as any || "default",
        fontSize: parseInt(req.query.fontSize as string) || 12,
        includeHeader: req.query.includeHeader !== "false",
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title || 'notes'}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
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
async function processContentInBackground(noteId: number, content: string, settings: AISettings) {
  try {
    // Update status to processing
    await storage.updateNoteStatus(noteId, "processing");
    
    // Process with Gemini AI
    const processedContent = await summarizeContentWithGemini(content, settings);
    
    // Update note with processed content
    await storage.updateNoteContent(noteId, processedContent);
    
    console.log(`Successfully processed note ${noteId}`);
  } catch (error) {
    console.error(`Failed to process note ${noteId}:`, error);
    await storage.updateNoteStatus(noteId, "failed");
  }
}
