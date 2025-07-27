import { MemStorage, type IStorage } from "./storage";
import { summarizeContentWithGemini } from "./services/gemini";
import { 
  insertNoteSchema, type ProcessedNote
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

// Simple PDF text extraction for Workers (basic implementation)
function extractTextFromPDFSimple(buffer: Uint8Array): string {
  // This is a very basic implementation for demonstration
  // In a real implementation, you'd need a Workers-compatible PDF parser
  const text = new TextDecoder().decode(buffer);
  // Extract any readable text from PDF structure
  const matches = text.match(/\((.*?)\)/g);
  if (matches) {
    return matches.map(match => match.slice(1, -1)).join(' ');
  }
  return "PDF content (text extraction limited in Workers environment)";
}

// Parse simple form data for file uploads (text files only)
async function parseFormData(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  const buffer = await file.arrayBuffer();
  return {
    filename: file.name,
    contentType: file.type,
    content: new Uint8Array(buffer),
  };
}

// API Route handlers
async function handleUpload(request: Request): Promise<Response> {
  try {
    const fileData = await parseFormData(request);
    
    let content: string;
    
    try {
      if (fileData.contentType === 'application/pdf') {
        console.log(`Processing PDF file: ${fileData.filename}, size: ${fileData.content.length} bytes`);
        content = extractTextFromPDFSimple(fileData.content);
        console.log(`PDF text extraction completed, extracted ${content.length} characters`);
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

    // Process content with AI (basic Gemini only for now)
    try {
      const processedContent = await summarizeContentWithGemini(validatedData.content, validatedData.settings);

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

      return errorResponse("API endpoint not found", 404);
    } catch (error) {
      console.error('API error:', error);
      return errorResponse("Internal server error", 500);
    }
  }

  // Serve static files and SPA
  if (path.startsWith('/assets/')) {
    // Static assets would need to be handled differently in Workers
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