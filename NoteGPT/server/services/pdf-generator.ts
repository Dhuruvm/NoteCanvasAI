import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface PDFOptions {
  designStyle: 'academic' | 'modern' | 'minimal' | 'colorful';
  includeVisualElements: boolean;
  useEnhancedLayout: boolean;
  colorScheme: string;
}

export async function generateEnhancedPDF(
  note: any,
  originalContent: string,
  options: PDFOptions
): Promise<Uint8Array> {
  console.log('Generating enhanced PDF with visual elements...');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Color schemes
  const colorSchemes = {
    blue: { primary: rgb(0.2, 0.4, 0.8), secondary: rgb(0.1, 0.3, 0.6), accent: rgb(0.9, 0.95, 1), background: rgb(0.98, 0.99, 1) },
    green: { primary: rgb(0.2, 0.6, 0.3), secondary: rgb(0.1, 0.4, 0.2), accent: rgb(0.9, 1, 0.95), background: rgb(0.98, 1, 0.98) },
    purple: { primary: rgb(0.5, 0.3, 0.8), secondary: rgb(0.4, 0.2, 0.6), accent: rgb(0.98, 0.95, 1), background: rgb(0.99, 0.98, 1) },
    orange: { primary: rgb(0.9, 0.5, 0.1), secondary: rgb(0.7, 0.4, 0.1), accent: rgb(1, 0.98, 0.9), background: rgb(1, 0.99, 0.97) }
  };

  const colors = colorSchemes[options.colorScheme as keyof typeof colorSchemes] || colorSchemes.blue;

  // Add background color to prevent blank pages
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: colors.background
  });

  let yPos = height - 80;

  // Header with gradient effect simulation
  page.drawRectangle({
    x: 40,
    y: yPos - 10,
    width: width - 80,
    height: 60,
    color: colors.accent,
    borderColor: colors.primary,
    borderWidth: 2
  });

  // Title
  const title = note.title || 'Generated Notes';
  page.drawText(title, {
    x: 60,
    y: yPos + 15,
    size: 24,
    font: helveticaBoldFont,
    color: colors.primary
  });

  // Multi-Model AI Badge
  page.drawRectangle({
    x: width - 180,
    y: yPos + 20,
    width: 120,
    height: 20,
    color: colors.primary
  });

  page.drawText('Multi-Model AI', {
    x: width - 170,
    y: yPos + 25,
    size: 10,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1)
  });

  yPos -= 100;

  // Content processing
  const processedContent = note.processedContent || {};
  
  // Add Key Concepts section
  if (processedContent.keyConcepts && Array.isArray(processedContent.keyConcepts) && processedContent.keyConcepts.length > 0) {
    yPos = await addKeyConceptsSection(page, processedContent.keyConcepts, colors, helveticaBoldFont, helveticaFont, yPos, width);
  }

  // Add Summary Points section
  if (processedContent.summaryPoints && Array.isArray(processedContent.summaryPoints) && processedContent.summaryPoints.length > 0) {
    yPos = await addSummaryPointsSection(page, processedContent.summaryPoints, colors, helveticaBoldFont, helveticaFont, yPos, width);
  }

  // Add original content if no structured content exists
  if ((!processedContent.keyConcepts || processedContent.keyConcepts.length === 0) && 
      (!processedContent.summaryPoints || processedContent.summaryPoints.length === 0)) {
    yPos = await addOriginalContent(page, originalContent || note.originalContent || 'No content available', colors, helveticaFont, yPos, width);
  }

  // Add visual elements indicator if enabled
  if (options.includeVisualElements) {
    yPos = await addVisualElementsSection(page, colors, helveticaBoldFont, helveticaFont, yPos, width);
  }

  // Footer
  page.drawLine({
    start: { x: 60, y: 60 },
    end: { x: width - 60, y: 60 },
    thickness: 1,
    color: colors.secondary
  });

  page.drawText('Generated with NoteGPT - Multi-Model AI Processing', {
    x: 60,
    y: 40,
    size: 9,
    font: helveticaFont,
    color: colors.secondary
  });

  page.drawText(`Page 1 of 1`, {
    x: width - 120,
    y: 40,
    size: 9,
    font: helveticaFont,
    color: colors.secondary
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

async function addKeyConceptsSection(page: any, keyConcepts: any[], colors: any, boldFont: any, regularFont: any, yPos: number, width: number): Promise<number> {
  // Section header
  page.drawRectangle({
    x: 50,
    y: yPos - 5,
    width: width - 100,
    height: 25,
    color: colors.accent,
    borderColor: colors.primary,
    borderWidth: 1
  });

  page.drawText('Key Concepts', {
    x: 60,
    y: yPos + 5,
    size: 16,
    font: boldFont,
    color: colors.primary
  });

  yPos -= 40;

  keyConcepts.forEach((concept, index) => {
    if (yPos < 100) return; // Stop if running out of space

    // Concept number circle
    page.drawCircle({
      x: 70,
      y: yPos - 5,
      size: 8,
      color: colors.primary
    });

    page.drawText((index + 1).toString(), {
      x: 67,
      y: yPos - 8,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    // Concept title and definition
    const title = concept.title || concept.concept || `Concept ${index + 1}`;
    const definition = concept.definition || concept.description || 'No definition available';

    page.drawText(title, {
      x: 90,
      y: yPos,
      size: 12,
      font: boldFont,
      color: colors.primary
    });

    // Wrap definition text
    const wrappedDefinition = wrapText(definition, width - 140, regularFont, 10);
    let defYPos = yPos - 15;

    wrappedDefinition.slice(0, 3).forEach(line => { // Limit to 3 lines per concept
      page.drawText(line, {
        x: 90,
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

async function addSummaryPointsSection(page: any, summaryPoints: any[], colors: any, boldFont: any, regularFont: any, yPos: number, width: number): Promise<number> {
  // Section header
  page.drawRectangle({
    x: 50,
    y: yPos - 5,
    width: width - 100,
    height: 25,
    color: colors.accent,
    borderColor: colors.primary,
    borderWidth: 1
  });

  page.drawText('Summary Points', {
    x: 60,
    y: yPos + 5,
    size: 16,
    font: boldFont,
    color: colors.primary
  });

  yPos -= 40;

  summaryPoints.forEach((section, sectionIndex) => {
    if (yPos < 100) return; // Stop if running out of space

    // Section heading
    const heading = section.heading || section.title || `Section ${sectionIndex + 1}`;
    page.drawText(`${sectionIndex + 1}. ${heading}`, {
      x: 60,
      y: yPos,
      size: 14,
      font: boldFont,
      color: colors.secondary
    });

    yPos -= 20;

    // Points
    const points = section.points || (Array.isArray(section) ? section : [section]);
    points.slice(0, 5).forEach((point: string) => { // Limit to 5 points per section
      if (yPos < 100) return;

      // Bullet point
      page.drawCircle({
        x: 75,
        y: yPos - 3,
        size: 2,
        color: colors.primary
      });

      // Point text
      const wrappedPoint = wrapText(point, width - 140, regularFont, 10);
      wrappedPoint.slice(0, 2).forEach(line => { // Limit to 2 lines per point
        page.drawText(line, {
          x: 85,
          y: yPos,
          size: 10,
          font: regularFont,
          color: rgb(0.2, 0.2, 0.2)
        });
        yPos -= 12;
      });

      yPos -= 5;
    });

    yPos -= 15;
  });

  return yPos - 20;
}

async function addOriginalContent(page: any, content: string, colors: any, font: any, yPos: number, width: number): Promise<number> {
  // Section header
  page.drawRectangle({
    x: 50,
    y: yPos - 5,
    width: width - 100,
    height: 25,
    color: colors.accent,
    borderColor: colors.primary,
    borderWidth: 1
  });

  page.drawText('Content', {
    x: 60,
    y: yPos + 5,
    size: 16,
    font: font,
    color: colors.primary
  });

  yPos -= 40;

  // Add content with wrapping
  const wrappedContent = wrapText(content, width - 120, font, 11);
  wrappedContent.slice(0, 30).forEach(line => { // Limit content to prevent overflow
    if (yPos < 100) return;
    
    page.drawText(line, {
      x: 60,
      y: yPos,
      size: 11,
      font: font,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPos -= 14;
  });

  return yPos - 20;
}

async function addVisualElementsSection(page: any, colors: any, boldFont: any, regularFont: any, yPos: number, width: number): Promise<number> {
  // Visual elements indicator
  page.drawRectangle({
    x: 50,
    y: yPos - 20,
    width: width - 100,
    height: 40,
    color: colors.accent,
    borderColor: colors.primary,
    borderWidth: 1
  });

  page.drawText('✓ Enhanced with Visual AI Processing', {
    x: 60,
    y: yPos - 5,
    size: 12,
    font: boldFont,
    color: colors.primary
  });

  page.drawText('Charts, diagrams, and visual elements optimized for learning', {
    x: 60,
    y: yPos - 18,
    size: 9,
    font: regularFont,
    color: colors.secondary
  });

  return yPos - 50;
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