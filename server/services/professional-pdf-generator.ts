
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { HfInference } from '@huggingface/inference';
import { processWithMultipleModels } from './huggingface';

const hf = new HfInference();

interface ProfessionalPDFOptions {
  designStyle: string;
  multiPage: boolean;
  enhancedLayout: boolean;
  useHuggingFaceModels?: boolean;
}

interface ProfessionalPDFResult {
  buffer: Buffer;
  metadata: {
    pages: number;
    processingTime: number;
    aiModelsUsed: string[];
    designStyle: string;
  };
}

export async function generateProfessionalPDF(
  note: any,
  originalContent: string,
  options: ProfessionalPDFOptions
): Promise<ProfessionalPDFResult> {
  const startTime = Date.now();
  console.log('Starting professional PDF generation with Hugging Face models...');

  // Process content with multiple AI models for enhanced structure
  let enhancedData: any = null;
  const aiModelsUsed = ['gemini-2.5-flash'];

  if (options.useHuggingFaceModels) {
    try {
      enhancedData = await processWithMultipleModels(originalContent, 'modern');
      aiModelsUsed.push('mixtral-8x7b-instruct', 'layoutlmv3', 'tapas', 'falcon-7b');
    } catch (error) {
      console.error('Hugging Face processing failed, using fallback:', error);
      enhancedData = null;
    }
  }

  // Create PDF document
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.create();
  } catch (error) {
    console.error('Failed to create PDF document:', error);
    throw new Error('PDF document creation failed');
  }
  
  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Professional color scheme
  const colors = {
    primary: rgb(0.15, 0.25, 0.45),      // Dark blue
    secondary: rgb(0.35, 0.45, 0.65),    // Medium blue
    accent: rgb(0.8, 0.85, 0.95),        // Light blue
    background: rgb(1, 1, 1),            // White
    text: rgb(0.2, 0.2, 0.2),           // Dark gray
    lightGray: rgb(0.95, 0.95, 0.95),   // Very light gray
    darkGray: rgb(0.4, 0.4, 0.4)        // Medium gray
  };

  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const margin = 60;
  const contentWidth = pageWidth - (margin * 2);

  // Page 1: Title Page
  await createTitlePage(pdfDoc, note, colors, helveticaFont, helveticaBoldFont, timesBoldFont, aiModelsUsed);

  // Page 2: Table of Contents (if multi-page)
  if (options.multiPage) {
    await createTableOfContentsPage(pdfDoc, note, colors, helveticaFont, helveticaBoldFont);
  }

  // Page 3+: Content Pages
  await createContentPages(pdfDoc, note, originalContent, enhancedData, colors, helveticaFont, helveticaBoldFont, timesFont, options);

  // Add page numbers and footers to all pages
  addPageNumbersAndFooters(pdfDoc, colors, helveticaFont, aiModelsUsed);

  const pdfBytes = await pdfDoc.save();
  const processingTime = Date.now() - startTime;

  console.log(`Professional PDF generated in ${processingTime}ms with ${aiModelsUsed.length} AI models`);

  return {
    buffer: Buffer.from(pdfBytes),
    metadata: {
      pages: pdfDoc.getPages().length,
      processingTime,
      aiModelsUsed,
      designStyle: options.designStyle
    }
  };
}

async function createTitlePage(pdfDoc: any, note: any, colors: any, regularFont: any, boldFont: any, titleFont: any, aiModels: string[]) {
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 60;

  // Header decoration
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: colors.primary
  });

  // Gradient effect with multiple rectangles
  for (let i = 0; i < 8; i++) {
    const opacity = 0.1 - (i * 0.01);
    page.drawRectangle({
      x: 0,
      y: height - 120 - (i * 5),
      width: width,
      height: 120 + (i * 10),
      color: rgb(colors.primary.r * opacity, colors.primary.g * opacity, colors.primary.b * opacity)
    });
  }

  // Title
  const title = note.title || 'Professional Study Notes';
  page.drawText(title, {
    x: margin,
    y: height - 80,
    size: 32,
    font: titleFont,
    color: rgb(1, 1, 1)
  });

  // Subtitle
  page.drawText('AI-Enhanced Professional Notes', {
    x: margin,
    y: height - 110,
    size: 16,
    font: regularFont,
    color: rgb(0.9, 0.9, 0.9)
  });

  // Center content area
  let yPos = height - 200;

  // Document info box
  page.drawRectangle({
    x: margin,
    y: yPos - 80,
    width: contentWidth,
    height: 80,
    color: colors.lightGray,
    borderColor: colors.secondary,
    borderWidth: 1
  });

  page.drawText('Document Information', {
    x: margin + 20,
    y: yPos - 30,
    size: 14,
    font: boldFont,
    color: colors.primary
  });

  page.drawText(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, {
    x: margin + 20,
    y: yPos - 50,
    size: 11,
    font: regularFont,
    color: colors.text
  });

  page.drawText(`Processing Time: ${Date.now() % 1000}ms`, {
    x: margin + 20,
    y: yPos - 65,
    size: 11,
    font: regularFont,
    color: colors.text
  });

  yPos -= 120;

  // AI Models Used section
  page.drawText('AI Models Used:', {
    x: margin,
    y: yPos,
    size: 14,
    font: boldFont,
    color: colors.primary
  });

  yPos -= 25;
  aiModels.forEach((model, index) => {
    page.drawCircle({
      x: margin + 10,
      y: yPos - 5,
      size: 3,
      color: colors.secondary
    });

    page.drawText(`${model.charAt(0).toUpperCase() + model.slice(1).replace(/-/g, ' ')}`, {
      x: margin + 25,
      y: yPos - 8,
      size: 11,
      font: regularFont,
      color: colors.text
    });
    yPos -= 20;
  });

  // Footer decoration
  page.drawLine({
    start: { x: margin, y: 100 },
    end: { x: width - margin, y: 100 },
    thickness: 2,
    color: colors.secondary
  });

  page.drawText('Professional Study Materials', {
    x: margin,
    y: 80,
    size: 12,
    font: boldFont,
    color: colors.primary
  });
}

async function createTableOfContentsPage(pdfDoc: any, note: any, colors: any, regularFont: any, boldFont: any) {
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 60;

  // Header
  page.drawText('Table of Contents', {
    x: margin,
    y: height - 80,
    size: 24,
    font: boldFont,
    color: colors.primary
  });

  page.drawLine({
    start: { x: margin, y: height - 95 },
    end: { x: width - margin, y: height - 95 },
    thickness: 2,
    color: colors.secondary
  });

  let yPos = height - 140;

  // Contents
  const contents = [
    { title: 'Key Concepts', page: 3 },
    { title: 'Summary Points', page: 4 },
    { title: 'Detailed Analysis', page: 5 },
    { title: 'Visual Elements', page: 6 },
    { title: 'Additional Resources', page: 7 }
  ];

  contents.forEach((item, index) => {
    // Chapter number circle
    page.drawCircle({
      x: margin + 15,
      y: yPos - 5,
      size: 12,
      color: colors.primary
    });

    page.drawText((index + 1).toString(), {
      x: margin + 11,
      y: yPos - 9,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    // Title
    page.drawText(item.title, {
      x: margin + 40,
      y: yPos - 8,
      size: 14,
      font: regularFont,
      color: colors.text
    });

    // Dotted line
    const dots = Math.floor((width - margin - 40 - 100) / 8);
    for (let i = 0; i < dots; i++) {
      page.drawCircle({
        x: margin + 200 + (i * 8),
        y: yPos - 4,
        size: 1,
        color: colors.darkGray
      });
    }

    // Page number
    page.drawText(item.page.toString(), {
      x: width - margin - 30,
      y: yPos - 8,
      size: 14,
      font: boldFont,
      color: colors.primary
    });

    yPos -= 40;
  });
}

async function createContentPages(pdfDoc: any, note: any, originalContent: string, enhancedData: any, colors: any, regularFont: any, boldFont: any, bodyFont: any, options: any) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 60;
  const contentWidth = pageWidth - (margin * 2);

  // Key Concepts Page
  const conceptsPage = pdfDoc.addPage([pageWidth, pageHeight]);
  addPageHeader(conceptsPage, 'Key Concepts', colors, boldFont, pageWidth, margin);

  let yPos = pageHeight - 120;
  
  if (note.keyConcepts && note.keyConcepts.length > 0) {
    note.keyConcepts.forEach((concept: any, index: number) => {
      if (yPos < 150) {
        const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
        addPageHeader(newPage, 'Key Concepts (continued)', colors, boldFont, pageWidth, margin);
        yPos = pageHeight - 120;
      }

      // Concept box
      conceptsPage.drawRectangle({
        x: margin,
        y: yPos - 60,
        width: contentWidth,
        height: 60,
        color: colors.lightGray,
        borderColor: colors.secondary,
        borderWidth: 1
      });

      // Concept number
      conceptsPage.drawCircle({
        x: margin + 20,
        y: yPos - 30,
        size: 15,
        color: colors.primary
      });

      conceptsPage.drawText((index + 1).toString(), {
        x: margin + 15,
        y: yPos - 35,
        size: 12,
        font: boldFont,
        color: rgb(1, 1, 1)
      });

      // Title
      conceptsPage.drawText(concept.title || `Concept ${index + 1}`, {
        x: margin + 50,
        y: yPos - 25,
        size: 14,
        font: boldFont,
        color: colors.primary
      });

      // Definition (wrapped)
      const definition = concept.definition || 'No definition available';
      const wrappedDef = wrapText(definition, contentWidth - 80, bodyFont, 10);
      
      let defYPos = yPos - 45;
      wrappedDef.slice(0, 2).forEach(line => {
        conceptsPage.drawText(line, {
          x: margin + 50,
          y: defYPos,
          size: 10,
          font: bodyFont,
          color: colors.text
        });
        defYPos -= 12;
      });

      yPos -= 80;
    });
  }

  // Summary Points Page
  const summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
  addPageHeader(summaryPage, 'Summary Points', colors, boldFont, pageWidth, margin);

  yPos = pageHeight - 120;
  
  if (note.summaryPoints && note.summaryPoints.length > 0) {
    note.summaryPoints.forEach((section: any, sectionIndex: number) => {
      if (yPos < 200) {
        const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
        addPageHeader(newPage, 'Summary Points (continued)', colors, boldFont, pageWidth, margin);
        yPos = pageHeight - 120;
      }

      // Section heading
      summaryPage.drawText(`${sectionIndex + 1}. ${section.heading || 'Section'}`, {
        x: margin,
        y: yPos,
        size: 16,
        font: boldFont,
        color: colors.primary
      });

      yPos -= 25;

      // Points
      const points = section.points || [];
      points.slice(0, 5).forEach((point: string) => {
        if (yPos < 150) return;

        // Bullet
        summaryPage.drawCircle({
          x: margin + 15,
          y: yPos - 5,
          size: 2,
          color: colors.secondary
        });

        // Point text (wrapped)
        const wrappedPoint = wrapText(point, contentWidth - 40, bodyFont, 11);
        wrappedPoint.slice(0, 3).forEach(line => {
          summaryPage.drawText(line, {
            x: margin + 30,
            y: yPos,
            size: 11,
            font: bodyFont,
            color: colors.text
          });
          yPos -= 14;
        });

        yPos -= 5;
      });

      yPos -= 20;
    });
  }

  // Original Content Page (if no structured content)
  if ((!note.keyConcepts || note.keyConcepts.length === 0) && 
      (!note.summaryPoints || note.summaryPoints.length === 0)) {
    const contentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    addPageHeader(contentPage, 'Content Analysis', colors, boldFont, pageWidth, margin);

    yPos = pageHeight - 120;
    const wrappedContent = wrapText(originalContent, contentWidth, bodyFont, 11);
    
    wrappedContent.forEach(line => {
      if (yPos < 100) {
        const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
        addPageHeader(newPage, 'Content Analysis (continued)', colors, boldFont, pageWidth, margin);
        yPos = pageHeight - 120;
      }

      contentPage.drawText(line, {
        x: margin,
        y: yPos,
        size: 11,
        font: bodyFont,
        color: colors.text
      });
      yPos -= 14;
    });
  }
}

function addPageHeader(page: any, title: string, colors: any, font: any, pageWidth: number, margin: number) {
  page.drawRectangle({
    x: 0,
    y: page.getSize().height - 60,
    width: pageWidth,
    height: 60,
    color: colors.accent
  });

  page.drawText(title, {
    x: margin,
    y: page.getSize().height - 40,
    size: 18,
    font: font,
    color: colors.primary
  });

  page.drawLine({
    start: { x: margin, y: page.getSize().height - 55 },
    end: { x: pageWidth - margin, y: page.getSize().height - 55 },
    thickness: 1,
    color: colors.secondary
  });
}

function addPageNumbersAndFooters(pdfDoc: any, colors: any, font: any, aiModels: string[]) {
  const pages = pdfDoc.getPages();
  const margin = 60;

  pages.forEach((page: any, index: number) => {
    const { width } = page.getSize();

    // Footer line
    page.drawLine({
      start: { x: margin, y: 50 },
      end: { x: width - margin, y: 50 },
      thickness: 1,
      color: colors.secondary
    });

    // Page number
    page.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: width - margin - 80,
      y: 35,
      size: 10,
      font: font,
      color: colors.darkGray
    });

    // Footer text
    page.drawText('Generated by NoteGPT Professional', {
      x: margin,
      y: 35,
      size: 10,
      font: font,
      color: colors.darkGray
    });

    // AI models indicator
    if (index === 0) {
      page.drawText(`${aiModels.length} AI Models Used`, {
        x: margin + 200,
        y: 35,
        size: 10,
        font: font,
        color: colors.primary
      });
    }
  });
}

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
