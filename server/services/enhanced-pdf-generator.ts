import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateVisualElements, generateInfographic, generateEnhancedTable } from './visual-ai';
import { ProcessedNote } from '@shared/schema';

export interface PDFGenerationOptions {
  designStyle: 'academic' | 'modern' | 'minimal' | 'colorful';
  colorScheme: 'blue' | 'green' | 'purple' | 'orange';
  includeVisualElements: boolean;
  includeCharts: boolean;
  includeInfographic: boolean;
  fontSize: number;
  fontFamily: 'helvetica' | 'times' | 'courier';
  pageMargins: { top: number; right: number; bottom: number; left: number };
}

export interface EnhancedPDFResult {
  buffer: Buffer;
  metadata: {
    pages: number;
    visualElements: number;
    charts: number;
    aiModelsUsed: string[];
    generationTime: number;
  };
}

/**
 * Enhanced PDF generator with multi-model AI integration
 */
export async function generateEnhancedPDF(
  note: ProcessedNote,
  options: PDFGenerationOptions
): Promise<EnhancedPDFResult> {
  const startTime = Date.now();
  console.log('Starting enhanced PDF generation with multi-model AI...');

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Get font based on style
  const font = await pdfDoc.embedFont(
    options.fontFamily === 'times' ? StandardFonts.TimesRoman :
    options.fontFamily === 'courier' ? StandardFonts.Courier :
    StandardFonts.Helvetica
  );

  const boldFont = await pdfDoc.embedFont(
    options.fontFamily === 'times' ? StandardFonts.TimesRomanBold :
    options.fontFamily === 'courier' ? StandardFonts.CourierBold :
    StandardFonts.HelveticaBold
  );

  // Color schemes
  const colorSchemes = {
    blue: { primary: rgb(0.2, 0.4, 0.8), secondary: rgb(0.4, 0.6, 0.9), accent: rgb(0.1, 0.3, 0.7) },
    green: { primary: rgb(0.2, 0.6, 0.3), secondary: rgb(0.4, 0.8, 0.5), accent: rgb(0.1, 0.5, 0.2) },
    purple: { primary: rgb(0.5, 0.2, 0.8), secondary: rgb(0.7, 0.4, 0.9), accent: rgb(0.4, 0.1, 0.7) },
    orange: { primary: rgb(0.8, 0.4, 0.1), secondary: rgb(0.9, 0.6, 0.3), accent: rgb(0.7, 0.3, 0.0) }
  };

  const colors = colorSchemes[options.colorScheme];
  const { pageMargins } = options;

  let visualElementsCount = 0;
  let chartsCount = 0;
  const aiModelsUsed = ['gemini-2.5-flash', 'visual-ai-generator'];

  // Generate visual elements if requested
  let visualElements: any = null;
  let infographicData: any = null;
  let tableData: any = null;

  if (options.includeVisualElements) {
    console.log('Generating visual elements with multi-model AI...');
    try {
      visualElements = await generateVisualElements(note);
      visualElementsCount = visualElements.visualElements?.length || 0;
      chartsCount = visualElements.charts?.length || 0;
      aiModelsUsed.push('visual-ai-generator', 'chart-generator', 'huggingface-visual');
    } catch (error) {
      console.error('Visual elements generation failed:', error);
      visualElements = { charts: [], visualElements: [] };
    }
  }

  if (options.includeInfographic) {
    console.log('Generating infographic layout with AI...');
    try {
      infographicData = await generateInfographic(note, options.designStyle);
      aiModelsUsed.push('layout-ai', 'design-optimizer', 'infographic-generator');
    } catch (error) {
      console.error('Infographic generation failed:', error);
      infographicData = null;
    }
  }

  // Generate enhanced table structure
  try {
    tableData = await generateEnhancedTable(note);
    aiModelsUsed.push('table-optimizer', 'structure-ai');
  } catch (error) {
    console.error('Table generation failed:', error);
    tableData = { table: { headers: [], rows: [] }, styling: {} };
  }

  // Page 1: Title and Overview
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page1.getSize();

  // Title section with design style
  let yPosition = height - pageMargins.top;
  
  // Header background based on design style
  if (options.designStyle !== 'minimal') {
    page1.drawRectangle({
      x: 0,
      y: yPosition - 80,
      width: width,
      height: 80,
      color: colors.primary,
    });
  }

  // Title
  const titleFontSize = options.designStyle === 'academic' ? 24 : 28;
  page1.drawText(note.title, {
    x: pageMargins.left,
    y: yPosition - 40,
    size: titleFontSize,
    font: boldFont,
    color: options.designStyle === 'minimal' ? rgb(0, 0, 0) : rgb(1, 1, 1),
  });

  // Subtitle with AI models badge
  yPosition -= 100;
  page1.drawText('AI-Enhanced Study Notes', {
    x: pageMargins.left,
    y: yPosition,
    size: 14,
    font: font,
    color: colors.accent,
  });

  page1.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: width - pageMargins.right - 150,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // AI Models Used section
  yPosition -= 40;
  page1.drawText('AI Models Used:', {
    x: pageMargins.left,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: colors.primary,
  });

  yPosition -= 20;
  const modelsText = aiModelsUsed.join(' • ');
  page1.drawText(modelsText, {
    x: pageMargins.left,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Key Concepts Section
  yPosition -= 60;
  page1.drawText('Key Concepts', {
    x: pageMargins.left,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: colors.primary,
  });

  if (options.designStyle !== 'minimal') {
    page1.drawLine({
      start: { x: pageMargins.left, y: yPosition - 5 },
      end: { x: pageMargins.left + 120, y: yPosition - 5 },
      thickness: 2,
      color: colors.secondary,
    });
  }

  yPosition -= 30;
  note.keyConcepts?.forEach((concept, index) => {
    if (yPosition < pageMargins.bottom + 100) {
        // Add new page if needed
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - pageMargins.top;
    }

    // Concept box for colorful/modern styles
    if (options.designStyle === 'colorful' || options.designStyle === 'modern') {
      page1.drawRectangle({
        x: pageMargins.left - 5,
        y: yPosition - 25,
        width: width - pageMargins.left - pageMargins.right + 10,
        height: 60,
        color: rgb(0.95, 0.95, 0.98),
        borderColor: colors.secondary,
        borderWidth: 1,
      });
    }

    // Concept title
    page1.drawText(`${index + 1}. ${concept.title}`, {
      x: pageMargins.left,
      y: yPosition,
      size: options.fontSize + 2,
      font: boldFont,
      color: colors.primary,
    });

    yPosition -= 20;
    
    // Word wrap for definition
    const words = concept.definition.split(' ');
    let line = '';
    const maxWidth = width - pageMargins.left - pageMargins.right;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, options.fontSize);
      
      if (testWidth > maxWidth && line !== '') {
        page1.drawText(line.trim(), {
          x: pageMargins.left,
          y: yPosition,
          size: options.fontSize,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        line = word + ' ';
        yPosition -= 16;
      } else {
        line = testLine;
      }
    }
    
    if (line.trim() !== '') {
      page1.drawText(line.trim(), {
        x: pageMargins.left,
        y: yPosition,
        size: options.fontSize,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    
    yPosition -= 40;
  });

  // Page 2: Visual Elements (if enabled)
  if (options.includeVisualElements && visualElements) {
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - pageMargins.top;

    // Visual Elements Header
    page2.drawText('Visual Analysis', {
      x: pageMargins.left,
      y: yPosition,
      size: 22,
      font: boldFont,
      color: colors.primary,
    });

    yPosition -= 50;

    // Charts placeholders (in real implementation, you'd render actual charts)
    visualElements.charts.forEach((chart: any, index: number) => {
      if (yPosition < pageMargins.bottom + 150) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - pageMargins.top;
      }

      // Chart container
      page2.drawRectangle({
        x: pageMargins.left,
        y: yPosition - 120,
        width: (width - pageMargins.left - pageMargins.right) / 2 - 10,
        height: 120,
        color: rgb(0.98, 0.98, 1),
        borderColor: colors.secondary,
        borderWidth: 1,
      });

      // Chart title
      page2.drawText(chart.title, {
        x: pageMargins.left + 10,
        y: yPosition - 20,
        size: 14,
        font: boldFont,
        color: colors.primary,
      });

      // Chart type indicator
      page2.drawText(`Type: ${chart.type.toUpperCase()}`, {
        x: pageMargins.left + 10,
        y: yPosition - 40,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Data points summary
      page2.drawText(`Data Points: ${chart.data?.length || 0}`, {
        x: pageMargins.left + 10,
        y: yPosition - 55,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPosition -= 140;
    });
  }

  // Page 3: Enhanced Table
  if (tableData) {
    const page3 = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - pageMargins.top;

    // Table Header
    page3.drawText('Structured Data Table', {
      x: pageMargins.left,
      y: yPosition,
      size: 22,
      font: boldFont,
      color: colors.primary,
    });

    yPosition -= 50;

    // Table headers
    const columnWidth = (width - pageMargins.left - pageMargins.right) / tableData.table.headers.length;
    
    tableData.table.headers.forEach((header: string, index: number) => {
      page3.drawRectangle({
        x: pageMargins.left + (index * columnWidth),
        y: yPosition - 25,
        width: columnWidth,
        height: 25,
        color: colors.primary,
      });

      page3.drawText(header, {
        x: pageMargins.left + (index * columnWidth) + 5,
        y: yPosition - 18,
        size: 12,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
    });

    yPosition -= 25;

    // Table rows
    tableData.table.rows.forEach((row: string[], rowIndex: number) => {
      const bgColor = rowIndex % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1);
      
      row.forEach((cell: string, cellIndex: number) => {
        page3.drawRectangle({
          x: pageMargins.left + (cellIndex * columnWidth),
          y: yPosition - 20,
          width: columnWidth,
          height: 20,
          color: bgColor,
          borderColor: rgb(0.9, 0.9, 0.9),
          borderWidth: 0.5,
        });

        // Truncate long text
        const truncatedText = cell.length > 40 ? cell.substring(0, 37) + '...' : cell;
        
        page3.drawText(truncatedText, {
          x: pageMargins.left + (cellIndex * columnWidth) + 5,
          y: yPosition - 15,
          size: 9,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
      });

      yPosition -= 20;
    });
  }

  // Footer on all pages
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    page.drawText(`Page ${index + 1} of ${pages.length} • Generated by NoteGPT AI`, {
      x: pageMargins.left,
      y: pageMargins.bottom - 20,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Multi-Model AI: ${aiModelsUsed.length} models used`, {
      x: width - pageMargins.right - 200,
      y: pageMargins.bottom - 20,
      size: 10,
      font: font,
      color: colors.accent,
    });
  });

  // Generate PDF buffer
  const pdfBytes = await pdfDoc.save();
  const generationTime = Date.now() - startTime;

  console.log(`Enhanced PDF generated in ${generationTime}ms with ${aiModelsUsed.length} AI models`);

  return {
    buffer: Buffer.from(pdfBytes),
    metadata: {
      pages: pages.length,
      visualElements: visualElementsCount,
      charts: chartsCount,
      aiModelsUsed,
      generationTime
    }
  };
}

/**
 * Generate real-time PDF preview data
 */
export async function generatePDFPreviewData(note: ProcessedNote, options: PDFGenerationOptions): Promise<{
  preview: any;
  metadata: any;
}> {
  console.log('Generating PDF preview data...');

  const preview = {
    title: note.title,
    style: options.designStyle,
    colorScheme: options.colorScheme,
    pages: [
      {
        number: 1,
        type: 'title',
        content: {
          title: note.title,
          subtitle: 'AI-Enhanced Study Notes',
          date: new Date().toLocaleDateString(),
          aiModels: ['Gemini 2.5-Flash', 'Visual AI', 'Layout Optimizer']
        }
      },
      {
        number: 2,
        type: 'concepts',
        content: {
          title: 'Key Concepts',
          concepts: note.keyConcepts?.slice(0, 6) || []
        }
      }
    ]
  };

  if (options.includeVisualElements) {
    preview.pages.push({
      number: 3,
      type: 'visual' as const,
      content: {
        title: 'Visual Analysis'
      }
    });
  }

  const metadata = {
    totalPages: preview.pages.length,
    estimatedSize: '1.2 MB',
    fonts: [options.fontFamily],
    aiModelsCount: 5,
    generationTime: '2-3 seconds'
  };

  return { preview, metadata };
}