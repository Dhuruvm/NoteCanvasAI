import { HfInference } from '@huggingface/inference';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ProcessedNote } from '@shared/schema';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface AdvancedPDFOptions {
  designStyle: 'academic' | 'modern' | 'minimal' | 'colorful';
  includeVisualElements: boolean;
  useEnhancedLayout: boolean;
  colorScheme: string;
}

export async function generateAdvancedPDF(
  note: ProcessedNote,
  originalContent: string,
  options: AdvancedPDFOptions = {
    designStyle: 'modern',
    includeVisualElements: true,
    useEnhancedLayout: true,
    colorScheme: 'blue'
  }
): Promise<Uint8Array> {
  console.log('Starting advanced PDF generation with multiple AI models...');

  try {
    // Step 1: Create enhanced content structure (simplified for now)
    const enhancedStructure = await generateSimplifiedStructure(note);

    // Step 2: Create visual design layout
    const visualLayout = await createVisualLayout(enhancedStructure, options);

    // Step 3: Generate the PDF with enhanced design
    const pdfBytes = await createEnhancedPDF(note, visualLayout, options);

    console.log('Advanced PDF generation completed successfully');
    return pdfBytes;

  } catch (error) {
    console.error('Advanced PDF generation failed, falling back to basic PDF:', error);
    return await generateBasicPDF(note, options);
  }
}

async function generateSimplifiedStructure(note: ProcessedNote): Promise<EnhancedContentStructure> {
  console.log('Generating simplified enhanced content structure...');

  try {
    // Enhanced content structure without external API calls for now
    return {
      title: note.title,
      sections: convertNoteToSections(note),
      layout: {
        templateType: 'modern',
        sections: [],
        theme: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          fontFamily: 'sans-serif',
          spacing: 'comfortable'
        }
      },
      visualElements: extractVisualElements(note, {})
    };

  } catch (error) {
    console.error('Content structure generation failed:', error);
    // Fallback to original structure
    return {
      title: note.title,
      sections: convertNoteToSections(note),
      layout: null,
      visualElements: []
    };
  }
}

async function createVisualLayout(
  content: EnhancedContentStructure,
  options: AdvancedPDFOptions
): Promise<VisualLayoutDesign> {
  console.log('Creating visual layout design...');

  const colorSchemes = {
    blue: { primary: rgb(0.2, 0.4, 0.8), secondary: rgb(0.1, 0.3, 0.6), accent: rgb(0.9, 0.95, 1) },
    green: { primary: rgb(0.2, 0.6, 0.3), secondary: rgb(0.1, 0.4, 0.2), accent: rgb(0.9, 1, 0.95) },
    purple: { primary: rgb(0.5, 0.3, 0.8), secondary: rgb(0.4, 0.2, 0.6), accent: rgb(0.98, 0.95, 1) },
    orange: { primary: rgb(0.9, 0.5, 0.1), secondary: rgb(0.7, 0.4, 0.1), accent: rgb(1, 0.98, 0.9) }
  };

  const colors = colorSchemes[options.colorScheme as keyof typeof colorSchemes] || colorSchemes.blue;

  return {
    pageSize: { width: 595, height: 842 }, // A4
    margins: { top: 80, bottom: 80, left: 60, right: 60 },
    colors,
    typography: getTypographySettings(options.designStyle),
    layout: content.layout || getDefaultLayout(options.designStyle),
    sections: content.sections
  };
}

async function createEnhancedPDF(
  note: ProcessedNote,
  layout: VisualLayoutDesign,
  options: AdvancedPDFOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let currentPage = pdfDoc.addPage([layout.pageSize.width, layout.pageSize.height]);
  let yPosition = layout.pageSize.height - layout.margins.top;

  // Add header with design styling
  yPosition = await addEnhancedHeader(currentPage, note.title, layout, boldFont, yPosition);

  // Add metadata section
  if (note.metadata?.aiModelsUsed?.includes('mixtral-8x7b-instruct')) {
    yPosition = await addEnhancedMetadata(currentPage, note, layout, regularFont, yPosition);
  }

  // Add key concepts with visual styling
  yPosition = await addEnhancedKeyConcepts(currentPage, note.keyConcepts, layout, boldFont, regularFont, yPosition);

  // Check if we need a new page
  if (yPosition < layout.margins.bottom + 200) {
    currentPage = pdfDoc.addPage([layout.pageSize.width, layout.pageSize.height]);
    yPosition = layout.pageSize.height - layout.margins.top;
  }

  // Add summary points with enhanced formatting
  yPosition = await addEnhancedSummaryPoints(currentPage, note.summaryPoints, layout, boldFont, regularFont, yPosition);

  // Add process flow if available
  if (note.processFlow && note.processFlow.length > 0) {
    if (yPosition < layout.margins.bottom + 150) {
      currentPage = pdfDoc.addPage([layout.pageSize.width, layout.pageSize.height]);
      yPosition = layout.pageSize.height - layout.margins.top;
    }
    yPosition = await addEnhancedProcessFlow(currentPage, note.processFlow, layout, boldFont, regularFont, yPosition);
  }

  // Add enhanced content if available
  if (note.enhancedContent) {
    if (yPosition < layout.margins.bottom + 100) {
      currentPage = pdfDoc.addPage([layout.pageSize.width, layout.pageSize.height]);
      yPosition = layout.pageSize.height - layout.margins.top;
    }
    await addEnhancedContent(currentPage, note.enhancedContent, layout, regularFont, italicFont, yPosition);
  }

  // Add footer with AI attribution
  addEnhancedFooter(pdfDoc, layout, regularFont);

  const pdfBytes = await pdfDoc.save();

  return Buffer.from(pdfBytes);
}

async function addEnhancedHeader(
  page: any, 
  title: string, 
  layout: VisualLayoutDesign, 
  font: any, 
  yPos: number
): Promise<number> {
  // Add background rectangle for header
  page.drawRectangle({
    x: layout.margins.left - 20,
    y: yPos - 40,
    width: layout.pageSize.width - layout.margins.left - layout.margins.right + 40,
    height: 50,
    color: layout.colors.accent,
    borderColor: layout.colors.primary,
    borderWidth: 1
  });

  // Add title
  page.drawText(title, {
    x: layout.margins.left,
    y: yPos - 25,
    size: 24,
    font,
    color: layout.colors.primary
  });

  // Add decorative line
  page.drawLine({
    start: { x: layout.margins.left, y: yPos - 50 },
    end: { x: layout.pageSize.width - layout.margins.right, y: yPos - 50 },
    thickness: 2,
    color: layout.colors.secondary
  });

  return yPos - 80;
}

async function addEnhancedMetadata(
  page: any,
  note: ProcessedNote,
  layout: VisualLayoutDesign,
  font: any,
  yPos: number
): Promise<number> {
  const modelsUsed = note.metadata?.aiModelsUsed?.join(', ') || 'AI Enhanced';

  page.drawText('Enhanced with AI Models:', {
    x: layout.margins.left,
    y: yPos,
    size: 10,
    font,
    color: layout.colors.secondary
  });

  page.drawText(modelsUsed, {
    x: layout.margins.left + 120,
    y: yPos,
    size: 10,
    font,
    color: layout.colors.primary
  });

  return yPos - 30;
}

async function addEnhancedKeyConcepts(
  page: any,
  keyConcepts: any[],
  layout: VisualLayoutDesign,
  boldFont: any,
  regularFont: any,
  yPos: number
): Promise<number> {
  // Section header with background
  page.drawRectangle({
    x: layout.margins.left - 10,
    y: yPos - 5,
    width: layout.pageSize.width - layout.margins.left - layout.margins.right + 20,
    height: 25,
    color: layout.colors.accent
  });

  page.drawText('Key Concepts', {
    x: layout.margins.left,
    y: yPos,
    size: 16,
    font: boldFont,
    color: layout.colors.primary
  });

  yPos -= 40;

  keyConcepts.forEach((concept, index) => {
    // Add concept number with circle
    page.drawCircle({
      x: layout.margins.left + 10,
      y: yPos - 5,
      size: 8,
      color: layout.colors.primary
    });

    page.drawText((index + 1).toString(), {
      x: layout.margins.left + 7,
      y: yPos - 8,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    // Add concept title
    page.drawText(concept.title, {
      x: layout.margins.left + 30,
      y: yPos,
      size: 12,
      font: boldFont,
      color: layout.colors.primary
    });

    // Add concept definition with word wrapping
    const wrappedDefinition = wrapText(concept.definition, layout.pageSize.width - layout.margins.left - layout.margins.right - 30, regularFont, 10);
    let defYPos = yPos - 15;

    wrappedDefinition.forEach(line => {
      page.drawText(line, {
        x: layout.margins.left + 30,
        y: defYPos,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      defYPos -= 12;
    });

    yPos = defYPos - 10;
  });

  return yPos - 20;
}

async function addEnhancedSummaryPoints(
  page: any,
  summaryPoints: any[],
  layout: VisualLayoutDesign,
  boldFont: any,
  regularFont: any,
  yPos: number
): Promise<number> {
  // Section header
  page.drawRectangle({
    x: layout.margins.left - 10,
    y: yPos - 5,
    width: layout.pageSize.width - layout.margins.left - layout.margins.right + 20,
    height: 25,
    color: layout.colors.accent
  });

  page.drawText('Summary Points', {
    x: layout.margins.left,
    y: yPos,
    size: 16,
    font: boldFont,
    color: layout.colors.primary
  });

  yPos -= 40;

  summaryPoints.forEach((section, sectionIndex) => {
    // Add section heading
    page.drawText(`${sectionIndex + 1}. ${section.heading}`, {
      x: layout.margins.left,
      y: yPos,
      size: 14,
      font: boldFont,
      color: layout.colors.secondary
    });

    yPos -= 20;

    // Add bullet points
    section.points.forEach((point: string) => {
      // Add bullet
      page.drawCircle({
        x: layout.margins.left + 15,
        y: yPos - 3,
        size: 2,
        color: layout.colors.primary
      });

      // Add point text with wrapping
      const wrappedPoint = wrapText(point, layout.pageSize.width - layout.margins.left - layout.margins.right - 30, regularFont, 10);
      let pointYPos = yPos;

      wrappedPoint.forEach(line => {
        page.drawText(line, {
          x: layout.margins.left + 25,
          y: pointYPos,
          size: 10,
          font: regularFont,
          color: rgb(0.2, 0.2, 0.2)
        });
        pointYPos -= 12;
      });

      yPos = pointYPos - 5;
    });

    yPos -= 15;
  });

  return yPos;
}

async function addEnhancedProcessFlow(
  page: any,
  processFlow: any[],
  layout: VisualLayoutDesign,
  boldFont: any,
  regularFont: any,
  yPos: number
): Promise<number> {
  // Section header
  page.drawRectangle({
    x: layout.margins.left - 10,
    y: yPos - 5,
    width: layout.pageSize.width - layout.margins.left - layout.margins.right + 20,
    height: 25,
    color: layout.colors.accent
  });

  page.drawText('Process Flow', {
    x: layout.margins.left,
    y: yPos,
    size: 16,
    font: boldFont,
    color: layout.colors.primary
  });

  yPos -= 40;

  processFlow.forEach((step, index) => {
    // Add step number in a rectangle
    page.drawRectangle({
      x: layout.margins.left,
      y: yPos - 15,
      width: 30,
      height: 20,
      color: layout.colors.primary
    });

    page.drawText(step.step.toString(), {
      x: layout.margins.left + 12,
      y: yPos - 8,
      size: 12,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    // Add arrow if not last step
    if (index < processFlow.length - 1) {
      page.drawLine({
        start: { x: layout.margins.left + 15, y: yPos - 25 },
        end: { x: layout.margins.left + 15, y: yPos - 35 },
        thickness: 2,
        color: layout.colors.secondary
      });

      // Arrow head
      page.drawLine({
        start: { x: layout.margins.left + 12, y: yPos - 32 },
        end: { x: layout.margins.left + 15, y: yPos - 35 },
        thickness: 2,
        color: layout.colors.secondary
      });
      page.drawLine({
        start: { x: layout.margins.left + 18, y: yPos - 32 },
        end: { x: layout.margins.left + 15, y: yPos - 35 },
        thickness: 2,
        color: layout.colors.secondary
      });
    }

    // Add step title and description
    page.drawText(step.title, {
      x: layout.margins.left + 40,
      y: yPos - 5,
      size: 12,
      font: boldFont,
      color: layout.colors.primary
    });

    const wrappedDescription = wrapText(step.description, layout.pageSize.width - layout.margins.left - layout.margins.right - 50, regularFont, 10);
    let descYPos = yPos - 18;

    wrappedDescription.forEach(line => {
      page.drawText(line, {
        x: layout.margins.left + 40,
        y: descYPos,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      descYPos -= 12;
    });

    yPos = descYPos - 25;
  });

  return yPos;
}

async function addEnhancedContent(
  page: any,
  enhancedContent: string,
  layout: VisualLayoutDesign,
  font: any,
  italicFont: any,
  yPos: number
): Promise<number> {
  // Section header
  page.drawRectangle({
    x: layout.margins.left - 10,
    y: yPos - 5,
    width: layout.pageSize.width - layout.margins.left - layout.margins.right + 20,
    height: 25,
    color: layout.colors.accent
  });

  page.drawText('AI Enhanced Analysis', {
    x: layout.margins.left,
    y: yPos,
    size: 16,
    font: italicFont,
    color: layout.colors.primary
  });

  yPos -= 30;

  // Add enhanced content with formatting
  const wrappedContent = wrapText(enhancedContent, layout.pageSize.width - layout.margins.left - layout.margins.right, font, 10);

  wrappedContent.forEach(line => {
    page.drawText(line, {
      x: layout.margins.left,
      y: yPos,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPos -= 12;
  });

  return yPos;
}

function addEnhancedFooter(pdfDoc: any, layout: VisualLayoutDesign, font: any) {
  const pages = pdfDoc.getPages();

  pages.forEach((page: any, index: number) => {
    // Add footer line
    page.drawLine({
      start: { x: layout.margins.left, y: layout.margins.bottom - 10 },
      end: { x: layout.pageSize.width - layout.margins.right, y: layout.margins.bottom - 10 },
      thickness: 1,
      color: layout.colors.secondary
    });

    // Add page number
    page.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: layout.pageSize.width - layout.margins.right - 60,
      y: layout.margins.bottom - 25,
      size: 9,
      font,
      color: layout.colors.secondary
    });

    // Add AI attribution
    page.drawText('Generated with AI-Enhanced Processing', {
      x: layout.margins.left,
      y: layout.margins.bottom - 25,
      size: 9,
      font,
      color: layout.colors.secondary
    });
  });
}

// Helper functions
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function parseEnhancedSections(enhancedText: string, originalNote: ProcessedNote): any[] {
  // Parse the enhanced content into sections
  return [
    {
      type: 'concepts',
      content: originalNote.keyConcepts,
      enhanced: true
    },
    {
      type: 'summary',
      content: originalNote.summaryPoints,
      enhanced: true
    }
  ];
}

function convertNoteToSections(note: ProcessedNote): any[] {
  return [
    { type: 'concepts', content: note.keyConcepts, enhanced: false },
    { type: 'summary', content: note.summaryPoints, enhanced: false }
  ];
}

function extractVisualElements(note: ProcessedNote, analysis: any): any[] {
  const elements = [];

  if (note.processFlow && note.processFlow.length > 0) {
    elements.push({ type: 'flowchart', data: note.processFlow });
  }

  // Check for visual elements in the processed content
  if (note.keyConcepts && note.keyConcepts.length > 0) {
    elements.push({ type: 'concepts', data: note.keyConcepts });
  }

  if (note.summaryPoints && note.summaryPoints.length > 0) {
    elements.push({ type: 'summary', data: note.summaryPoints });
  }

  return elements;
}

function getTypographySettings(style: string) {
  const settings = {
    academic: { headerSize: 18, bodySize: 11, lineHeight: 1.4 },
    modern: { headerSize: 20, bodySize: 10, lineHeight: 1.3 },
    minimal: { headerSize: 16, bodySize: 10, lineHeight: 1.5 },
    colorful: { headerSize: 22, bodySize: 11, lineHeight: 1.3 }
  };

  return settings[style as keyof typeof settings] || settings.modern;
}

function getDefaultLayout(style: string) {
  return {
    templateType: style,
    sections: [],
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'sans-serif',
      spacing: 'comfortable'
    }
  };
}

async function generateBasicPDF(note: ProcessedNote, options: AdvancedPDFOptions): Promise<Uint8Array> {
  console.log('Generating fallback basic PDF...');

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 750;

    // Title
    page.drawText(note.title || 'Study Notes', {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });

    yPosition -= 40;

    // Key Concepts
    if (note.keyConcepts && note.keyConcepts.length > 0) {
      page.drawText('Key Concepts:', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3)
      });

      yPosition -= 25;

      note.keyConcepts.forEach((concept, index) => {
        if (yPosition > 100) {
          page.drawText(`${index + 1}. ${concept.title}`, {
            x: 70,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: rgb(0.4, 0.4, 0.4)
          });

          yPosition -= 15;

          if (concept.definition && yPosition > 100) {
            const lines = wrapText(concept.definition, 450, font, 10);
            lines.forEach(line => {
              if (yPosition > 80) {
                page.drawText(line, {
                  x: 90,
                  y: yPosition,
                  size: 10,
                  font,
                  color: rgb(0.5, 0.5, 0.5)
                });
                yPosition -= 12;
              }
            });
          }

          yPosition -= 10;
        }
      });
    }

    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes);

  } catch (error) {
    console.error('Basic PDF generation failed:', error);
    throw new Error('PDF generation completely failed');
  }
}

// Type definitions
interface EnhancedContentStructure {
  title: string;
  sections: any[];
  layout: any;
  visualElements: any[];
}

interface VisualLayoutDesign {
  pageSize: { width: number; height: number };
  margins: { top: number; bottom: number; left: number; right: number };
  colors: { primary: any; secondary: any; accent: any };
  typography: any;
  layout: any;
  sections: any[];
}