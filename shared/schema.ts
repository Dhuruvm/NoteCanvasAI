import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  originalContent: text("original_content").notNull(),
  processedContent: jsonb("processed_content").notNull(),
  status: text("status", { enum: ["processing", "completed", "failed"] }).notNull().default("processing"),
  templateId: text("template_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  layout: jsonb("layout").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  originalContent: true,
  templateId: true,
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  id: true,
  name: true,
  description: true,
  layout: true,
  isDefault: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// AI Processing types
export interface ProcessedNote {
  title: string;
  keyConcepts: Array<{
    title: string;
    definition: string;
  }>;
  summaryPoints: Array<{
    heading: string;
    points: string[];
  }>;
  processFlow?: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  enhancedContent?: string;
  designLayout?: {
    templateType: 'academic' | 'modern' | 'minimal' | 'colorful';
    sections: Array<{
      id: string;
      type: 'header' | 'content' | 'sidebar' | 'footer';
      styling: Record<string, string>;
      content: string;
    }>;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      spacing: string;
    };
  };
  tableStructure?: string;
  metadata: {
    source: string;
    generatedAt: string;
    style: string;
    aiModelsUsed: string[];
  };
}

export interface AISettings {
  summaryStyle: "academic" | "bulletPoints" | "mindMap" | "qna";
  detailLevel: number;
  includeExamples: boolean;
  useMultipleModels?: boolean;
  designStyle?: "academic" | "modern" | "minimal" | "colorful";
}

// Additional interfaces for enhanced functionality
export interface EnhancedPreview {
  structuredView: {
    metadata: {
      wordCount: number;
      readingTime: number;
      conceptCount: number;
    };
  };
  aiInsights: {
    complexity: string;
    suggestions: string[];
  };
}

export interface VisualElement {
  type: 'chart' | 'diagram' | 'infographic';
  data: any;
  title: string;
  description?: string;
}

// Chat with PDF feature schemas
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull(),
  userId: text("user_id"),
  title: text("title").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).notNull().default("intermediate"),
  subject: text("subject"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type", { enum: ["text", "question", "answer", "quiz", "explanation", "research"] }).notNull().default("text"),
  metadata: jsonb("metadata"), // For storing additional data like sources, confidence, etc.
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: integer("session_id").notNull(),
  totalQuestions: integer("total_questions").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  badges: jsonb("badges").default([]), // Array of earned badges
  penalties: integer("penalties").notNull().default(0),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
});

export const predictedQuestions = pgTable("predicted_questions", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  topic: text("topic").notNull(),
  importance: integer("importance").notNull(), // 1-10 scale
  sources: jsonb("sources").default([]), // Web research sources
  isAsked: boolean("is_asked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas for new tables
export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  noteId: true,
  userId: true,
  title: true,
  difficulty: true,
  subject: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  role: true,
  content: true,
  messageType: true,
  metadata: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  sessionId: true,
  totalQuestions: true,
  correctAnswers: true,
  currentStreak: true,
  bestStreak: true,
  points: true,
  level: true,
  badges: true,
  penalties: true,
});

export const insertPredictedQuestionSchema = createInsertSchema(predictedQuestions).pick({
  noteId: true,
  question: true,
  answer: true,
  difficulty: true,
  topic: true,
  importance: true,
  sources: true,
});

// Type definitions for new schemas
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type PredictedQuestion = typeof predictedQuestions.$inferSelect;
export type InsertPredictedQuestion = z.infer<typeof insertPredictedQuestionSchema>;

// Chat interfaces
export interface ChatContext {
  noteContent: string;
  currentTopic: string;
  userLevel: "beginner" | "intermediate" | "advanced";
  previousQuestions: string[];
  userProgress: {
    correctAnswers: number;
    totalQuestions: number;
    currentStreak: number;
    points: number;
    level: number;
  };
}

export interface QuestionPrediction {
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  importance: number;
  reasoning: string;
  sources?: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
}

export interface RewardSystem {
  pointsEarned: number;
  streakBonus: number;
  levelUp: boolean;
  newBadges: string[];
  penalties: number;
  encouragement: string;
}