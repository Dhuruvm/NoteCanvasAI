import { Request, Response } from 'express';
import { z } from 'zod';
import { DocumentSchema, RenderOptionsSchema } from '@shared/template-schema';
import { TemplateEngine } from '../services/template-engine';
import { HTMLRenderer } from '../services/html-renderer';
import { TemplatePDFGenerator } from '../services/template-pdf-generator';
import { validateData } from '../middleware/validation';

const templateEngine = new TemplateEngine();
const htmlRenderer = new HTMLRenderer();
const pdfGenerator = new TemplatePDFGenerator();

/**
 * Template Engine API Routes
 * Implements the document generation endpoints from the architecture
 */

/**
 * Generate document preview (HTML)
 */
export const generatePreview = async (req: Request, res: Response) => {
  try {
    const { document, options } = validateData({
      document: DocumentSchema,
      options: RenderOptionsSchema.optional()
    }, req.body);

    const html = htmlRenderer.render(document, { 
      ...options, 
      format: 'html' 
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(400).json({ 
      error: 'Failed to generate preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate PDF document
 */
export const generatePDF = async (req: Request, res: Response) => {
  try {
    const { document, options } = validateData({
      document: DocumentSchema,
      options: RenderOptionsSchema.optional()
    }, req.body);

    const pdfBuffer = await pdfGenerator.generatePDF(document, {
      ...options,
      format: 'pdf'
    });

    const filename = `${document.meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate multiple formats
 */
export const generateMultiFormat = async (req: Request, res: Response) => {
  try {
    const { document, formats, options } = validateData({
      document: DocumentSchema,
      formats: z.array(z.string()),
      options: RenderOptionsSchema.optional()
    }, req.body);

    const results = await pdfGenerator.generateMultiFormat(document, formats);

    res.json({
      success: true,
      formats: Object.keys(results),
      data: Object.fromEntries(
        Object.entries(results).map(([format, buffer]) => [
          format,
          buffer.toString('base64')
        ])
      )
    });
  } catch (error) {
    console.error('Multi-format generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get available themes and templates
 */
export const getThemes = async (req: Request, res: Response) => {
  try {
    const themes = [
      {
        id: 'modern-card',
        name: 'Modern Card',
        description: 'Clean, card-based layout with modern typography',
        preview: '/api/templates/themes/modern-card/preview'
      },
      {
        id: 'classic-report',
        name: 'Classic Report',
        description: 'Traditional academic report style',
        preview: '/api/templates/themes/classic-report/preview'
      },
      {
        id: 'compact-notes',
        name: 'Compact Notes',
        description: 'Dense, space-efficient layout for quick reference',
        preview: '/api/templates/themes/compact-notes/preview'
      },
      {
        id: 'academic',
        name: 'Academic',
        description: 'Formal academic paper formatting',
        preview: '/api/templates/themes/academic/preview'
      },
      {
        id: 'presentation',
        name: 'Presentation',
        description: 'Slide-like layout for presentations',
        preview: '/api/templates/themes/presentation/preview'
      }
    ];

    res.json({
      success: true,
      themes
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch themes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Validate document structure
 */
export const validateDocument = async (req: Request, res: Response) => {
  try {
    const document = DocumentSchema.parse(req.body);

    // Additional validation using template engine
    const processedBlocks = templateEngine.processBlocks(document.blocks, document.styles);
    const tableOfContents = templateEngine.generateTableOfContents(document.blocks);

    res.json({
      valid: true,
      document,
      metadata: {
        totalBlocks: document.blocks.length,
        headingCount: document.blocks.filter(b => b.type === 'heading').length,
        tocEntries: tableOfContents.length,
        estimatedPages: Math.ceil(processedBlocks.length / 20) // Rough estimate
      }
    });
  } catch (error) {
    console.error('Document validation error:', error);
    res.status(400).json({ 
      valid: false,
      error: 'Document validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Convert text content to structured document
 */
export const convertToDocument = async (req: Request, res: Response) => {
  try {
    const { text, title, style } = validateData({
      text: z.string(),
      title: z.string().optional(),
      style: z.string().optional()
    }, req.body);

    // Simple text-to-document conversion
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    const document = {
      meta: {
        title: title || 'Generated Document',
        author: 'NoteGPT Template Engine',
        date: new Date().toISOString().split('T')[0],
        tags: ['generated']
      },
      outline: [],
      blocks: paragraphs.map((paragraph, index) => ({
        id: `block-${index}`,
        type: 'paragraph' as const,
        text: paragraph.trim(),
        importance: 0.5
      })),
      styles: {
        theme: (style as any) || 'modern-card',
        palette: ['#0B2140', '#19E7FF', '#F6F8FA'],
        fontPair: {
          heading: 'Inter',
          body: 'Roboto'
        }
      }
    };

    // Validate the generated document
    const validatedDocument = DocumentSchema.parse(document);

    res.json({
      success: true,
      document: validatedDocument
    });
  } catch (error) {
    console.error('Text conversion error:', error);
    res.status(400).json({ 
      error: 'Failed to convert text to document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Health check for template engine
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const pdfHealth = await pdfGenerator.healthCheck();
    
    res.json({
      status: 'healthy',
      services: {
        templateEngine: true,
        htmlRenderer: true,
        pdfGenerator: pdfHealth
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Template engine health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};