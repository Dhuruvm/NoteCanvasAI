import { 
  notes, templates, chatSessions, chatMessages, userProgress, predictedQuestions,
  type Note, type InsertNote, type Template, type InsertTemplate, type ProcessedNote,
  type ChatSession, type InsertChatSession, type ChatMessage, type InsertChatMessage,
  type UserProgress, type InsertUserProgress, type PredictedQuestion, type InsertPredictedQuestion
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private notes: Map<number, Note>;
  private templates: Map<string, Template>;
  private chatSessions: Map<number, ChatSession>;
  private chatMessages: Map<number, ChatMessage>;
  private userProgress: Map<string, UserProgress>; // userId_sessionId as key
  private predictedQuestions: Map<number, PredictedQuestion>;
  
  private currentNoteId: number;
  private currentChatSessionId: number;
  private currentChatMessageId: number;
  private currentProgressId: number;
  private currentQuestionId: number;

  constructor() {
    this.notes = new Map();
    this.templates = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.userProgress = new Map();
    this.predictedQuestions = new Map();
    
    this.currentNoteId = 1;
    this.currentChatSessionId = 1;
    this.currentChatMessageId = 1;
    this.currentProgressId = 1;
    this.currentQuestionId = 1;
    
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

  // Chat Sessions implementation
  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = this.currentChatSessionId++;
    const session: ChatSession = {
      ...insertSession,
      id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getChatSessionsByNote(noteId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.noteId === noteId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession> {
    const session = this.chatSessions.get(id);
    if (!session) {
      throw new Error(`Chat session with id ${id} not found`);
    }
    
    const updatedSession: ChatSession = {
      ...session,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.chatSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Chat Messages implementation
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getRecentChatMessages(sessionId: number, limit: number): Promise<ChatMessage[]> {
    const messages = await this.getChatMessagesBySession(sessionId);
    return messages.slice(-limit);
  }

  // User Progress implementation
  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentProgressId++;
    const key = `${insertProgress.userId}_${insertProgress.sessionId}`;
    const progress: UserProgress = {
      ...insertProgress,
      id,
      lastActivity: new Date(),
    };
    this.userProgress.set(key, progress);
    return progress;
  }

  async getUserProgress(userId: string, sessionId: number): Promise<UserProgress | undefined> {
    const key = `${userId}_${sessionId}`;
    return this.userProgress.get(key);
  }

  async updateUserProgress(userId: string, sessionId: number, updates: Partial<UserProgress>): Promise<UserProgress> {
    const key = `${userId}_${sessionId}`;
    const progress = this.userProgress.get(key);
    
    if (!progress) {
      // Create new progress if doesn't exist
      const newProgress: UserProgress = {
        id: this.currentProgressId++,
        userId,
        sessionId,
        totalQuestions: 0,
        correctAnswers: 0,
        currentStreak: 0,
        bestStreak: 0,
        points: 0,
        level: 1,
        badges: [],
        penalties: 0,
        lastActivity: new Date(),
        ...updates,
      };
      this.userProgress.set(key, newProgress);
      return newProgress;
    }
    
    const updatedProgress: UserProgress = {
      ...progress,
      ...updates,
      lastActivity: new Date(),
    };
    this.userProgress.set(key, updatedProgress);
    return updatedProgress;
  }

  async getUserProgressBySession(sessionId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(progress => progress.sessionId === sessionId);
  }

  // Predicted Questions implementation
  async createPredictedQuestion(insertQuestion: InsertPredictedQuestion): Promise<PredictedQuestion> {
    const id = this.currentQuestionId++;
    const question: PredictedQuestion = {
      ...insertQuestion,
      id,
      isAsked: false,
      createdAt: new Date(),
    };
    this.predictedQuestions.set(id, question);
    return question;
  }

  async getPredictedQuestionsByNote(noteId: number): Promise<PredictedQuestion[]> {
    return Array.from(this.predictedQuestions.values())
      .filter(question => question.noteId === noteId)
      .sort((a, b) => b.importance - a.importance);
  }

  async getUnaskedQuestions(noteId: number, limit: number): Promise<PredictedQuestion[]> {
    const questions = Array.from(this.predictedQuestions.values())
      .filter(question => question.noteId === noteId && !question.isAsked)
      .sort((a, b) => b.importance - a.importance);
    
    return questions.slice(0, limit);
  }

  async markQuestionAsAsked(id: number): Promise<PredictedQuestion> {
    const question = this.predictedQuestions.get(id);
    if (!question) {
      throw new Error(`Predicted question with id ${id} not found`);
    }
    
    const updatedQuestion: PredictedQuestion = {
      ...question,
      isAsked: true,
    };
    this.predictedQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }
}

export const storage = new MemStorage();
