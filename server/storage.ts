import { notes, templates, type Note, type InsertNote, type Template, type InsertTemplate, type ProcessedNote } from "@shared/schema";

export interface IStorage {
  // Notes CRUD
  createNote(note: InsertNote): Promise<Note>;
  getNote(id: number): Promise<Note | undefined>;
  updateNoteContent(id: number, processedContent: ProcessedNote): Promise<Note>;
  updateNoteStatus(id: number, status: "processing" | "completed" | "failed"): Promise<Note>;
  getAllNotes(): Promise<Note[]>;
  
  // Templates CRUD
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: string): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getDefaultTemplates(): Promise<Template[]>;
}

export class MemStorage implements IStorage {
  private notes: Map<number, Note>;
  private templates: Map<string, Template>;
  private currentNoteId: number;

  constructor() {
    this.notes = new Map();
    this.templates = new Map();
    this.currentNoteId = 1;
    
    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const defaultTemplates: InsertTemplate[] = [
      {
        id: "academic",
        name: "Academic Style",
        description: "Clean layout with structured sections perfect for academic content",
        layout: {
          theme: "professional",
          sections: ["title", "keyConcepts", "summaryPoints", "processFlow"],
          colors: {
            primary: "#6366F1",
            secondary: "#8B5CF6",
            accent: "#10B981"
          }
        },
        isDefault: true
      },
      {
        id: "bullet-points",
        name: "Bullet Points",
        description: "Simple bullet-point format for quick reference",
        layout: {
          theme: "minimal",
          sections: ["title", "summaryPoints"],
          colors: {
            primary: "#059669",
            secondary: "#0891B2",
            accent: "#DC2626"
          }
        },
        isDefault: true
      },
      {
        id: "colorful",
        name: "Colorful Mind Map",
        description: "Vibrant design with visual elements and icons",
        layout: {
          theme: "colorful",
          sections: ["title", "keyConcepts", "summaryPoints", "processFlow"],
          colors: {
            primary: "#F59E0B",
            secondary: "#EF4444",
            accent: "#8B5CF6"
          }
        },
        isDefault: true
      }
    ];

    defaultTemplates.forEach(template => {
      const fullTemplate: Template = {
        ...template,
        isDefault: template.isDefault ?? false
      };
      this.templates.set(template.id, fullTemplate);
    });
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = {
      ...insertNote,
      id,
      processedContent: {},
      status: "processing",
      createdAt: new Date(),
      templateId: insertNote.templateId ?? null
    };
    this.notes.set(id, note);
    return note;
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async updateNoteContent(id: number, processedContent: ProcessedNote): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    
    const updatedNote: Note = {
      ...note,
      processedContent,
      status: "completed",
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async updateNoteStatus(id: number, status: "processing" | "completed" | "failed"): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    
    const updatedNote: Note = {
      ...note,
      status,
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template: Template = {
      ...insertTemplate,
      isDefault: insertTemplate.isDefault ?? false
    };
    this.templates.set(template.id, template);
    return template;
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getDefaultTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(t => t.isDefault);
  }
}

export const storage = new MemStorage();
