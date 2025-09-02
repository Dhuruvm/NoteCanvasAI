import { z } from 'zod';

// Core content model schema - the single source of truth for template engine
export const DocumentSourceSchema = z.object({
  type: z.enum(['pdf', 'text', 'image', 'url']),
  uri: z.string(),
  page: z.number().optional(),
  timestamp: z.string().optional()
});

export const DocumentMetaSchema = z.object({
  title: z.string(),
  author: z.string().optional(),
  date: z.string(),
  source: z.array(DocumentSourceSchema).optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().default('en')
});

export const DocumentOutlineSchema = z.object({
  id: z.string(),
  level: z.number().min(1).max(6),
  title: z.string(),
  weight: z.number().min(0).max(1).default(0.5)
});

export const AnnotationSchema = z.object({
  type: z.enum(['highlight', 'underline', 'strikethrough', 'note', 'link']),
  span: z.tuple([z.number(), z.number()]),
  color: z.string().optional(),
  note: z.string().optional(),
  url: z.string().optional()
});

export const StyleHintsSchema = z.object({
  align: z.enum(['left', 'center', 'right', 'justify']).optional(),
  background: z.string().optional(),
  border: z.boolean().optional(),
  emphasis: z.enum(['normal', 'bold', 'italic', 'underline']).optional(),
  size: z.enum(['small', 'normal', 'large', 'xlarge']).optional()
});

export const DocumentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['heading', 'paragraph', 'list', 'quote', 'image', 'table', 'code', 'separator']),
  level: z.number().optional(),
  text: z.string().optional(),
  importance: z.number().min(0).max(1).default(0.5),
  annotations: z.array(AnnotationSchema).optional(),
  styleHints: StyleHintsSchema.optional(),
  // For lists
  ordered: z.boolean().optional(),
  items: z.array(z.string()).optional(),
  // For images
  mime: z.string().optional(),
  data: z.string().optional(),
  caption: z.string().optional(),
  url: z.string().optional(),
  // For tables
  headers: z.array(z.string()).optional(),
  rows: z.array(z.array(z.string())).optional(),
  // For code blocks
  language: z.string().optional()
});

export const DocumentStylesSchema = z.object({
  theme: z.enum(['modern-card', 'classic-report', 'compact-notes', 'academic', 'presentation']).default('modern-card'),
  palette: z.array(z.string()).default(['#0B2140', '#19E7FF', '#F6F8FA']),
  fontPair: z.object({
    heading: z.string().default('Inter'),
    body: z.string().default('Roboto')
  }).default({ heading: 'Inter', body: 'Roboto' }),
  spacing: z.enum(['compact', 'normal', 'relaxed']).default('normal'),
  pageSize: z.enum(['A4', 'A5', 'Letter', 'Legal']).default('A4')
});

export const DocumentSchema = z.object({
  meta: DocumentMetaSchema,
  outline: z.array(DocumentOutlineSchema),
  blocks: z.array(DocumentBlockSchema),
  styles: DocumentStylesSchema
});

// Layout computation schemas
export const LayoutConfigSchema = z.object({
  baseFontSize: z.number().default(14),
  scaleRatio: z.number().default(1.25),
  lineHeight: z.number().default(1.6),
  maxLineLength: z.number().default(70),
  marginTop: z.number().default(20),
  marginBottom: z.number().default(20),
  cardThreshold: z.number().default(0.7)
});

export const RenderOptionsSchema = z.object({
  format: z.enum(['html', 'pdf', 'docx']),
  template: z.string().optional(),
  includeAnnotations: z.boolean().default(true),
  includeTOC: z.boolean().default(true),
  includeFootnotes: z.boolean().default(true),
  pageNumbers: z.boolean().default(true)
});

// TypeScript types
export type DocumentSource = z.infer<typeof DocumentSourceSchema>;
export type DocumentMeta = z.infer<typeof DocumentMetaSchema>;
export type DocumentOutline = z.infer<typeof DocumentOutlineSchema>;
export type Annotation = z.infer<typeof AnnotationSchema>;
export type StyleHints = z.infer<typeof StyleHintsSchema>;
export type DocumentBlock = z.infer<typeof DocumentBlockSchema>;
export type DocumentStyles = z.infer<typeof DocumentStylesSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type RenderOptions = z.infer<typeof RenderOptionsSchema>;