import { 
  notes, templates, chatSessions, chatMessages, userProgress, predictedQuestions,
  type Note, type InsertNote, type Template, type InsertTemplate, type ProcessedNote,
  type ChatSession, type InsertChatSession, type ChatMessage, type InsertChatMessage,
  type UserProgress, type InsertUserProgress, type PredictedQuestion, type InsertPredictedQuestion
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";

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
  
  // Chat Sessions CRUD
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getChatSessionsByNote(noteId: number): Promise<ChatSession[]>;
  updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession>;
  
  // Chat Messages CRUD
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]>;
  getRecentChatMessages(sessionId: number, limit: number): Promise<ChatMessage[]>;
  
  // User Progress CRUD
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgress(userId: string, sessionId: number): Promise<UserProgress | undefined>;
  updateUserProgress(userId: string, sessionId: number, updates: Partial<UserProgress>): Promise<UserProgress>;
  getUserProgressBySession(sessionId: number): Promise<UserProgress[]>;
  
  // Predicted Questions CRUD
  createPredictedQuestion(question: InsertPredictedQuestion): Promise<PredictedQuestion>;
  getPredictedQuestionsByNote(noteId: number): Promise<PredictedQuestion[]>;
  getUnaskedQuestions(noteId: number, limit: number): Promise<PredictedQuestion[]>;
  markQuestionAsAsked(id: number): Promise<PredictedQuestion>;
}

// MemStorage class kept for reference but not used

export class DatabaseStorage implements IStorage {
  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values({
        ...insertNote,
        processedContent: {},
        status: "processing"
      })
      .returning();
    return note;
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async updateNoteContent(id: number, processedContent: ProcessedNote): Promise<Note> {
    const [note] = await db
      .update(notes)
      .set({
        processedContent,
        status: "completed"
      })
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async updateNoteStatus(id: number, status: "processing" | "completed" | "failed"): Promise<Note> {
    const [note] = await db
      .update(notes)
      .set({ status })
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async getAllNotes(): Promise<Note[]> {
    return await db.select().from(notes).orderBy(desc(notes.createdAt));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getDefaultTemplates(): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.isDefault, true));
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values({
        ...insertSession,
        userId: insertSession.userId || null,
        difficulty: insertSession.difficulty || "intermediate",
        subject: insertSession.subject || null
      })
      .returning();
    return session;
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async getChatSessionsByNote(noteId: number): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.noteId, noteId))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession> {
    const [session] = await db
      .update(chatSessions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(chatSessions.id, id))
      .returning();
    return session;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        ...insertMessage,
        messageType: insertMessage.messageType || "text",
        metadata: insertMessage.metadata || null
      })
      .returning();
    return message;
  }

  async getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  async getRecentChatMessages(sessionId: number, limit: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const [progress] = await db
      .insert(userProgress)
      .values(insertProgress)
      .returning();
    return progress;
  }

  async getUserProgress(userId: string, sessionId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.sessionId, sessionId)));
    return progress || undefined;
  }

  async updateUserProgress(userId: string, sessionId: number, updates: Partial<UserProgress>): Promise<UserProgress> {
    // First try to get existing progress
    const existing = await this.getUserProgress(userId, sessionId);
    
    if (!existing) {
      // Create new progress if doesn't exist
      return await this.createUserProgress({
        userId,
        sessionId,
        totalQuestions: 0,
        correctAnswers: 0,
        currentStreak: 0,
        bestStreak: 0,
        points: 0,
        level: 1,
        badges: [] as any,
        penalties: 0,
        ...updates
      });
    }
    
    const [progress] = await db
      .update(userProgress)
      .set({
        ...updates,
        lastActivity: new Date()
      })
      .where(and(eq(userProgress.userId, userId), eq(userProgress.sessionId, sessionId)))
      .returning();
    return progress;
  }

  async getUserProgressBySession(sessionId: number): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.sessionId, sessionId));
  }

  async createPredictedQuestion(insertQuestion: InsertPredictedQuestion): Promise<PredictedQuestion> {
    const [question] = await db
      .insert(predictedQuestions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async getPredictedQuestionsByNote(noteId: number): Promise<PredictedQuestion[]> {
    return await db
      .select()
      .from(predictedQuestions)
      .where(eq(predictedQuestions.noteId, noteId))
      .orderBy(desc(predictedQuestions.importance));
  }

  async getUnaskedQuestions(noteId: number, limit: number): Promise<PredictedQuestion[]> {
    return await db
      .select()
      .from(predictedQuestions)
      .where(and(eq(predictedQuestions.noteId, noteId), eq(predictedQuestions.isAsked, false)))
      .orderBy(desc(predictedQuestions.importance))
      .limit(limit);
  }

  async markQuestionAsAsked(id: number): Promise<PredictedQuestion> {
    const [question] = await db
      .update(predictedQuestions)
      .set({ isAsked: true })
      .where(eq(predictedQuestions.id, id))
      .returning();
    return question;
  }
}

// Initialize default templates in database
async function initializeDefaultTemplates() {
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

  try {
    for (const template of defaultTemplates) {
      const existing = await db.select().from(templates).where(eq(templates.id, template.id));
      if (existing.length === 0) {
        await db.insert(templates).values(template);
      }
    }
  } catch (error) {
    // Silently handle template initialization - templates likely already exist
    // Only log critical errors
    if (error && typeof error === 'object' && 'message' in error && !(error.message as string).includes('duplicate key')) {
      console.error("Template initialization error:", error);
    }
  }
}

export const storage = new DatabaseStorage();

// Export the initialization function to be called after server starts
export { initializeDefaultTemplates };
