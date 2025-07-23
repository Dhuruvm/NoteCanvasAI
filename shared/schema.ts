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
  metadata: {
    source: string;
    generatedAt: string;
    style: string;
  };
}

export interface AISettings {
  summaryStyle: "academic" | "bulletPoints" | "mindMap" | "qna";
  detailLevel: number;
  includeExamples: boolean;
}
