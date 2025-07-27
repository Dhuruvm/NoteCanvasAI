import { MemStorage, type IStorage } from "./storage";
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
import { z } from "zod";

// Initialize storage
const storage: IStorage = new MemStorage();

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

// Helper functions
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function errorResponse(message: string, status = 500) {
  return jsonResponse({ message }, status);
}

// Parse multipart form data for file uploads
async function parseMultipartFormData(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Not multipart form data');
  }

  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    throw new Error('No boundary found');
  }

  const body = await request.arrayBuffer();
  const decoder = new TextDecoder();
  const bodyText = decoder.decode(body);
  
  // Simple multipart parser for file upload
  const parts = bodyText.split(`--${boundary}`);
  
  for (const part of parts) {
    if (part.includes('filename=')) {
      const lines = part.split('\r\n');
      let contentStart = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === '') {
          contentStart = i + 1;
          break;
        }
      }
      
      if (contentStart !== -1) {
        const fileContent = lines.slice(contentStart, -1).join('\r\n');
        const filenameMatch = part.match(/filename="([^"]+)"/);
        const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);
        
        return {
          filename: filenameMatch ? filenameMatch[1] : 'unknown',
          contentType: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
          content: new TextEncoder().encode(fileContent),
        };
      }
    }
  }
  
  throw new Error('No file found in multipart data');
}

// API Route handlers
async function handleUpload(request: Request): Promise<Response> {
  try {
    const fileData = await parseMultipartFormData(request);
    
    let content: string;
    
    try {
      if (fileData.contentType === 'application/pdf') {
        console.log(`Processing PDF file: ${fileData.filename}, size: ${fileData.content.length} bytes`);
        content = await extractTextFromPDF(fileData.content);
        console.log(`PDF text extraction successful, extracted ${content.length} characters`);
      } else {
        content = new TextDecoder().decode(fileData.content);
        console.log(`Text file processed: ${content.length} characters`);
      }
    } catch (extractionError) {
      console.error(`File extraction failed for ${fileData.filename}:`, extractionError);
      return errorResponse(
        `Failed to process ${fileData.contentType === 'application/pdf' ? 'PDF' : 'text'} file: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`,
        400
      );
    }

    if (!content || !content.trim()) {
      return errorResponse("No readable content found in the uploaded file", 400);
    }

    // Create initial note
    const noteData = insertNoteSchema.parse({
      title: fileData.filename.replace(/\.[^/.]+$/, ""),
      originalContent: content,
      templateId: null,
    });

    const note = await storage.createNote(noteData);
    return jsonResponse({ noteId: note.id, content });
    
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(error instanceof Error ? error.message : "Upload failed", 400);
  }
}

async function handleProcessContent(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validatedData = processContentSchema.parse(body);

    const noteData = insertNoteSchema.parse({
      title: "Processed Note",
      originalContent: validatedData.content,
      templateId: null,
    });

    const note = await storage.createNote(noteData);

    // Process content with AI
    try {
      let processedContent;
      
      if (validatedData.settings.useMultipleModels) {
        processedContent = await processWithMultipleModels(validatedData.content, validatedData.settings);
      } else {
        processedContent = await summarizeContentWithGemini(validatedData.content, validatedData.settings);
      }

      const updatedNote = await storage.updateNoteContent(note.id, processedContent);
      await storage.updateNoteStatus(note.id, "completed");

      return jsonResponse({ noteId: updatedNote.id, processedContent });
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      await storage.updateNoteStatus(note.id, "failed");
      return errorResponse(`AI processing failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`, 500);
    }
  } catch (error) {
    console.error('Process content error:', error);
    return errorResponse(error instanceof Error ? error.message : "Processing failed", 400);
  }
}

async function handleGetNotes(): Promise<Response> {
  try {
    const notes = await storage.getAllNotes();
    return jsonResponse(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    return errorResponse("Failed to retrieve notes", 500);
  }
}

async function handleGetNote(noteId: string): Promise<Response> {
  try {
    const id = parseInt(noteId);
    if (isNaN(id)) {
      return errorResponse("Invalid note ID", 400);
    }

    const note = await storage.getNote(id);
    if (!note) {
      return errorResponse("Note not found", 404);
    }

    return jsonResponse(note);
  } catch (error) {
    console.error('Get note error:', error);
    return errorResponse("Failed to retrieve note", 500);
  }
}

async function handleGeneratePDF(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { noteId, options = {} } = body;

    if (!noteId) {
      return errorResponse("Note ID is required", 400);
    }

    const note = await storage.getNote(parseInt(noteId));
    if (!note) {
      return errorResponse("Note not found", 404);
    }

    if (note.status !== "completed") {
      return errorResponse("Note processing not completed", 400);
    }

    let pdfBuffer: Uint8Array;

    if (options.useAdvanced) {
      pdfBuffer = await generateAdvancedPDF(note.processedContent, options);
    } else if (options.useEnhanced) {
      pdfBuffer = await generateEnhancedPDF(note.processedContent, options);
    } else {
      pdfBuffer = await generateNotePDF(note.processedContent);
    }

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${note.title}.pdf"`,
        ...corsHeaders(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return errorResponse("PDF generation failed", 500);
  }
}

// Main request handler
export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  // API routes
  if (path.startsWith('/api/')) {
    try {
      if (path === '/api/upload' && method === 'POST') {
        return await handleUpload(request);
      }
      
      if (path === '/api/process' && method === 'POST') {
        return await handleProcessContent(request);
      }
      
      if (path === '/api/notes' && method === 'GET') {
        return await handleGetNotes();
      }
      
      if (path.match(/^\/api\/notes\/\d+$/) && method === 'GET') {
        const noteId = path.split('/').pop()!;
        return await handleGetNote(noteId);
      }
      
      if (path === '/api/generate-pdf' && method === 'POST') {
        return await handleGeneratePDF(request);
      }

      return errorResponse("API endpoint not found", 404);
    } catch (error) {
      console.error('API error:', error);
      return errorResponse("Internal server error", 500);
    }
  }

  // Serve static files and SPA
  if (path.startsWith('/assets/')) {
    // In a real deployment, static assets would be served from a different location
    return errorResponse("Static asset not found", 404);
  }

  // Serve SPA for all other routes
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NoteGPT</title>
    <script type="module" crossorigin src="/assets/index-CKCd9JjH.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-BFnmP4Ek.css">
</head>
<body>
    <div id="root"></div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      ...corsHeaders(),
    },
  });
}