// Professional Office-Style PDF Generator
// Creates polished corporate and executive documents

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { ADVANCED_PDF_STYLES, AdvancedPDFStyle, advancedPDFOrchestrator } from './advanced-pdf-architect';

export interface OfficeOptions {
  style: 'corporate' | 'executive' | 'report' | 'memo' | 'presentation';
  branding: boolean;
  headerFooter: boolean;
  tableOfContents: boolean;
  charts: boolean;
  appendices: boolean;
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface OfficeBranding {
  companyName: string;
  logoPosition: 'header' | 'footer' | 'watermark';
  colorScheme: 'primary' | 'secondary' | 'neutral';
  fontProfile: 'modern' | 'traditional' | 'technical';
}

export class OfficePDFGenerator {
  private templates: Map<string, any> = new Map();

  constructor() {
    this.initializeOfficeTemplates();
  }

  private initializeOfficeTemplates() {
    this.templates.set('corporate', {
      layout: 'single-column',
      sections: ['title-page', 'executive-summary', 'content', 'appendix'],
      formatting: 'formal',
      visualElements: ['charts', 'tables', 'infographics'],
      branding: 'prominent'
    });

    this.templates.set('executive', {
      layout: 'executive-summary',
      sections: ['cover', 'summary', 'key-findings', 'recommendations'],
      formatting: 'executive',
      visualElements: ['key-metrics', 'summary-charts'],
      branding: 'subtle'
    });

    this.templates.set('report', {
      layout: 'multi-section',
      sections: ['title', 'abstract', 'introduction', 'analysis', 'conclusion'],
      formatting: 'structured',
      visualElements: ['data-visualizations', 'process-flows'],
      branding: 'footer'
    });

    this.templates.set('memo', {
      layout: 'memo-format',
      sections: ['header', 'summary', 'details', 'action-items'],
      formatting: 'concise',
      visualElements: ['bullet-points', 'highlights'],
      branding: 'minimal'
    });

    this.templates.set('presentation', {
      layout: 'slide-style',
      sections: ['title', 'agenda', 'content-slides', 'conclusion'],
      formatting: 'presentation',
      visualElements: ['large-visuals', 'key-points'],
      branding: 'integrated'
    });
  }

  async generateOfficePDF(
    note: any,
    originalContent: string,
    options: OfficeOptions,
    branding?: OfficeBranding
  ): Promise<{ buffer: Buffer; metadata: any }> {
    const startTime = Date.now();
    console.log(`🏢 Generating office-style PDF: ${options.style}`);

    // Get office style configuration
    const styleKey = options.style === 'corporate' ? 'office-corporate' : 'office-executive';
    const style = ADVANCED_PDF_STYLES[styleKey];
    const template = this.templates.get(options.style) || this.templates.get('corporate')!;

    // Process with AI orchestrator for enhanced content
    const aiResults = await advancedPDFOrchestrator.processWithAllModels(note, style);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Load professional fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const accentFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const pageWidth = 595.28; // A4 width
    const pageHeight = 841.89; // A4 height
    const margins = style.layout.margins;

    // Professional color scheme
    const colors = this.parseColors(style.colors);

    let pageCount = 0;

    // Generate pages based on template
    if (template.sections.includes('title-page') || template.sections.includes('cover')) {
      await this.createTitlePage(
        pdfDoc, 
        note, 
        colors, 
        titleFont, 
        boldFont, 
        regularFont,
        options,
        branding,
        pageWidth,
        pageHeight,
        margins
      );
      pageCount++;
    }

    if (options.tableOfContents && template.sections.includes('content')) {
      await this.createTableOfContents(
        pdfDoc,
        note,
        colors,
        boldFont,
        regularFont,
        pageWidth,
        pageHeight,
        margins
      );
      pageCount++;
    }

    // Main content pages
    const contentPages = await this.createContentPages(
      pdfDoc,
      note,
      originalContent,
      colors,
      regularFont,
      boldFont,
      accentFont,
      options,
      template,
      aiResults,
      pageWidth,
      pageHeight,
      margins
    );
    pageCount += contentPages;

    // Add charts and visualizations if requested
    if (options.charts && aiResults.results['visual-composer']) {
      const chartPages = await this.createVisualizationPages(
        pdfDoc,
        aiResults.results['visual-composer'],
        colors,
        boldFont,
        regularFont,
        pageWidth,
        pageHeight,
        margins
      );
      pageCount += chartPages;
    }

    // Add headers and footers to all pages
    if (options.headerFooter) {
      await this.addHeadersAndFooters(
        pdfDoc,
        options,
        branding,
        colors,
        regularFont,
        pageWidth,
        pageHeight,
        margins
      );
    }

    // Add confidentiality markings
    if (options.confidentiality !== 'public') {
      await this.addConfidentialityMarkings(
        pdfDoc,
        options.confidentiality,
        colors,
        boldFont,
        pageWidth,
        pageHeight
      );
    }

    const pdfBytes = await pdfDoc.save();
    const processingTime = Date.now() - startTime;

    return {
      buffer: Buffer.from(pdfBytes),
      metadata: {
        style: `office-${options.style}`,
        template: template,
        processingTime,
        pages: pageCount,
        aiModelsUsed: aiResults.metadata.modelsUsed,
        features: {
          branding: options.branding,
          headerFooter: options.headerFooter,
          tableOfContents: options.tableOfContents,
          charts: options.charts,
          confidentiality: options.confidentiality
        },
        officeFeatures: {
          professionalLayout: true,
          corporateStyling: true,
          brandCompliance: branding ? true : false,
          dataVisualization: options.charts
        }
      }
    };
  }

  private parseColors(colorConfig: any) {
    return {
      primary: this.hexToRgb(colorConfig.primary),
      secondary: this.hexToRgb(colorConfig.secondary),
      accent: this.hexToRgb(colorConfig.accent),
      background: this.hexToRgb(colorConfig.background),
      text: this.hexToRgb(colorConfig.text),
      highlight: this.hexToRgb(colorConfig.highlight),
      border: this.hexToRgb(colorConfig.border)
    };
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return rgb(0, 0, 0);
    
    return rgb(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }

  private async createTitlePage(
    pdfDoc: PDFDocument,
    note: any,
    colors: any,
    titleFont: any,
    boldFont: any,
    regularFont: any,
    options: OfficeOptions,
    branding: OfficeBranding | undefined,
    pageWidth: number,
    pageHeight: number,
    margins: any
  ) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Corporate header background
    page.drawRectangle({
      x: 0,
      y: pageHeight - 120,
      width: pageWidth,
      height: 120,
      color: colors.primary
    });

    // Gradient effect simulation
    for (let i = 0; i < 8; i++) {
      const opacity = 0.1 - (i * 0.01);
      page.drawRectangle({
        x: 0,
        y: pageHeight - 120 - (i * 3),
        width: pageWidth,
        height: 120 + (i * 6),
        color: rgb(
          colors.primary.red * opacity,
          colors.primary.green * opacity,
          colors.primary.blue * opacity
        )
      });
    }

    // Company branding
    if (branding && options.branding) {
      page.drawText(branding.companyName, {
        x: margins.left,
        y: pageHeight - 50,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1)
      });
    }

    // Document title
    const title = note.title || 'Professional Document';
    page.drawText(title, {
      x: margins.left,
      y: pageHeight - 85,
      size: 28,
      font: titleFont,
      color: rgb(1, 1, 1)
    });

    // Subtitle
    page.drawText('AI-Generated Professional Document', {
      x: margins.left,
      y: pageHeight - 110,
      size: 14,
      font: regularFont,
      color: rgb(0.9, 0.9, 0.9)
    });

    // Document metadata box
    const metadataY = pageHeight - 220;
    page.drawRectangle({
      x: margins.left,
      y: metadataY - 80,
      width: pageWidth - margins.left - margins.right,
      height: 80,
      color: colors.accent,
      borderColor: colors.primary,
      borderWidth: 1
    });

    // Document information
    page.drawText('Document Information', {
      x: margins.left + 20,
      y: metadataY - 20,
      size: 14,
      font: boldFont,
      color: colors.primary
    });

    const currentDate = new Date();
    page.drawText(`Date: ${currentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, {
      x: margins.left + 20,
      y: metadataY - 40,
      size: 11,
      font: regularFont,
      color: colors.text
    });

    page.drawText(`Document Type: ${options.style.charAt(0).toUpperCase() + options.style.slice(1)}`, {
      x: margins.left + 20,
      y: metadataY - 55,
      size: 11,
      font: regularFont,
      color: colors.text
    });

    page.drawText(`Classification: ${options.confidentiality.toUpperCase()}`, {
      x: margins.left + 20,
      y: metadataY - 70,
      size: 11,
      font: regularFont,
      color: options.confidentiality === 'public' ? colors.text : colors.primary
    });

    // Professional footer
    page.drawLine({
      start: { x: margins.left, y: 100 },
      end: { x: pageWidth - margins.right, y: 100 },
      thickness: 2,
      color: colors.primary
    });

    page.drawText('Generated by NoteGPT Professional', {
      x: margins.left,
      y: 80,
      size: 12,
      font: boldFont,
      color: colors.primary
    });

    // Office-style corner elements
    this.addOfficeCornerElements(page, pageWidth, pageHeight, colors.secondary);
  }

  private async createTableOfContents(
    pdfDoc: PDFDocument,
    note: any,
    colors: any,
    boldFont: any,
    regularFont: any,
    pageWidth: number,
    pageHeight: number,
    margins: any
  ) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Header
    page.drawText('Table of Contents', {
      x: margins.left,
      y: pageHeight - 80,
      size: 24,
      font: boldFont,
      color: colors.primary
    });

    page.drawLine({
      start: { x: margins.left, y: pageHeight - 95 },
      end: { x: pageWidth - margins.right, y: pageHeight - 95 },
      thickness: 2,
      color: colors.primary
    });

    let yPos = pageHeight - 140;

    // Table of contents entries
    const tocEntries = [
      { title: 'Executive Summary', page: 3 },
      { title: 'Key Concepts Analysis', page: 4 },
      { title: 'Detailed Findings', page: 5 },
      { title: 'Summary Points', page: 6 },
      { title: 'Visual Analysis', page: 7 },
      { title: 'Recommendations', page: 8 },
      { title: 'Appendices', page: 9 }
    ];

    tocEntries.forEach((entry, index) => {
      // Section number
      page.drawRectangle({
        x: margins.left,
        y: yPos - 8,
        width: 24,
        height: 20,
        color: colors.primary
      });

      page.drawText((index + 1).toString(), {
        x: margins.left + 10,
        y: yPos - 2,
        size: 12,
        font: boldFont,
        color: rgb(1, 1, 1)
      });

      // Title
      page.drawText(entry.title, {
        x: margins.left + 40,
        y: yPos,
        size: 14,
        font: regularFont,
        color: colors.text
      });

      // Dotted line
      const titleWidth = regularFont.widthOfTextAtSize(entry.title, 14);
      const dotsStart = margins.left + 40 + titleWidth + 20;
      const dotsEnd = pageWidth - margins.right - 60;
      const dotCount = Math.floor((dotsEnd - dotsStart) / 8);
      
      for (let i = 0; i < dotCount; i++) {
        page.drawCircle({
          x: dotsStart + (i * 8),
          y: yPos + 2,
          size: 1,
          color: colors.border
        });
      }

      // Page number
      page.drawText(entry.page.toString(), {
        x: pageWidth - margins.right - 30,
        y: yPos,
        size: 14,
        font: boldFont,
        color: colors.primary
      });

      yPos -= 35;
    });
  }

  private async createContentPages(
    pdfDoc: PDFDocument,
    note: any,
    originalContent: string,
    colors: any,
    regularFont: any,
    boldFont: any,
    accentFont: any,
    options: OfficeOptions,
    template: any,
    aiResults: any,
    pageWidth: number,
    pageHeight: number,
    margins: any
  ): Promise<number> {
    let pageCount = 0;
    const processedContent = note.processedContent || {};

    // Executive Summary Page
    if (template.sections.includes('executive-summary') || template.sections.includes('summary')) {
      const summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageCount++;
      
      this.addPageHeader(summaryPage, 'Executive Summary', colors, boldFont, pageWidth, margins);
      
      let yPos = pageHeight - 120;
      
      // Summary content
      const summaryText = `This document presents an AI-generated analysis of the provided content. The analysis includes key concepts, detailed summaries, and actionable insights derived from advanced multi-model AI processing.`;
      
      const wrappedSummary = this.wrapText(summaryText, pageWidth - margins.left - margins.right - 40, regularFont, 12);
      
      wrappedSummary.forEach(line => {
        summaryPage.drawText(line, {
          x: margins.left + 20,
          y: yPos,
          size: 12,
          font: regularFont,
          color: colors.text
        });
        yPos -= 16;
      });

      yPos -= 20;

      // Key highlights
      summaryPage.drawText('Key Highlights:', {
        x: margins.left + 20,
        y: yPos,
        size: 14,
        font: boldFont,
        color: colors.primary
      });
      yPos -= 25;

      const highlights = [
        `${processedContent.keyConcepts?.length || 0} key concepts identified and analyzed`,
        `${processedContent.summaryPoints?.length || 0} summary sections with detailed insights`,
        'AI-enhanced formatting with professional layout optimization',
        'Multi-model processing for comprehensive content analysis'
      ];

      highlights.forEach(highlight => {
        summaryPage.drawCircle({
          x: margins.left + 35,
          y: yPos - 3,
          size: 3,
          color: colors.primary
        });

        summaryPage.drawText(highlight, {
          x: margins.left + 50,
          y: yPos,
          size: 11,
          font: regularFont,
          color: colors.text
        });
        yPos -= 20;
      });
    }

    // Key Concepts Page
    if (processedContent.keyConcepts && processedContent.keyConcepts.length > 0) {
      const conceptsPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageCount++;
      
      this.addPageHeader(conceptsPage, 'Key Concepts Analysis', colors, boldFont, pageWidth, margins);
      
      let yPos = pageHeight - 120;
      
      processedContent.keyConcepts.slice(0, 6).forEach((concept: any, index: number) => {
        if (yPos < 150) return;

        // Concept container
        conceptsPage.drawRectangle({
          x: margins.left + 10,
          y: yPos - 70,
          width: pageWidth - margins.left - margins.right - 20,
          height: 70,
          color: colors.accent,
          borderColor: colors.primary,
          borderWidth: 1
        });

        // Concept number badge
        conceptsPage.drawRectangle({
          x: margins.left + 20,
          y: yPos - 25,
          width: 30,
          height: 20,
          color: colors.primary
        });

        conceptsPage.drawText((index + 1).toString(), {
          x: margins.left + 30,
          y: yPos - 20,
          size: 12,
          font: boldFont,
          color: rgb(1, 1, 1)
        });

        // Concept title
        const title = concept.title || concept.concept || `Concept ${index + 1}`;
        conceptsPage.drawText(title, {
          x: margins.left + 60,
          y: yPos - 15,
          size: 14,
          font: boldFont,
          color: colors.primary
        });

        // Concept definition
        const definition = concept.definition || concept.description || 'No definition available';
        const wrappedDef = this.wrapText(definition, pageWidth - margins.left - margins.right - 80, regularFont, 10);
        
        let defY = yPos - 35;
        wrappedDef.slice(0, 3).forEach(line => {
          conceptsPage.drawText(line, {
            x: margins.left + 60,
            y: defY,
            size: 10,
            font: regularFont,
            color: colors.text
          });
          defY -= 12;
        });

        yPos -= 85;
      });
    }

    // Summary Points Page
    if (processedContent.summaryPoints && processedContent.summaryPoints.length > 0) {
      const summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageCount++;
      
      this.addPageHeader(summaryPage, 'Detailed Summary Points', colors, boldFont, pageWidth, margins);
      
      let yPos = pageHeight - 120;
      
      processedContent.summaryPoints.slice(0, 4).forEach((section: any, sectionIndex: number) => {
        if (yPos < 200) return;

        // Section header
        summaryPage.drawRectangle({
          x: margins.left + 10,
          y: yPos - 5,
          width: pageWidth - margins.left - margins.right - 20,
          height: 25,
          color: colors.primary
        });

        summaryPage.drawText(`${sectionIndex + 1}. ${section.heading || 'Summary Section'}`, {
          x: margins.left + 20,
          y: yPos + 5,
          size: 14,
          font: boldFont,
          color: rgb(1, 1, 1)
        });

        yPos -= 35;

        // Section points
        const points = section.points || [];
        points.slice(0, 4).forEach((point: string, pointIndex: number) => {
          if (yPos < 150) return;

          // Professional bullet
          summaryPage.drawRectangle({
            x: margins.left + 25,
            y: yPos - 8,
            width: 8,
            height: 8,
            color: colors.secondary
          });

          // Point text
          const wrappedPoint = this.wrapText(point, pageWidth - margins.left - margins.right - 60, regularFont, 11);
          let pointY = yPos;
          
          wrappedPoint.slice(0, 2).forEach(line => {
            summaryPage.drawText(line, {
              x: margins.left + 45,
              y: pointY,
              size: 11,
              font: regularFont,
              color: colors.text
            });
            pointY -= 14;
          });

          yPos = pointY - 5;
        });

        yPos -= 20;
      });
    }

    return pageCount;
  }

  private async createVisualizationPages(
    pdfDoc: PDFDocument,
    visualData: any,
    colors: any,
    boldFont: any,
    regularFont: any,
    pageWidth: number,
    pageHeight: number,
    margins: any
  ): Promise<number> {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    this.addPageHeader(page, 'Data Visualization & Analysis', colors, boldFont, pageWidth, margins);
    
    let yPos = pageHeight - 120;

    // Chart placeholders with professional styling
    if (visualData.visualElements && visualData.visualElements.length > 0) {
      visualData.visualElements.slice(0, 2).forEach((element: any, index: number) => {
        // Chart container
        page.drawRectangle({
          x: margins.left + 20,
          y: yPos - 200,
          width: pageWidth - margins.left - margins.right - 40,
          height: 180,
          color: colors.accent,
          borderColor: colors.primary,
          borderWidth: 2
        });

        // Chart title
        page.drawText(element.title || `Visualization ${index + 1}`, {
          x: margins.left + 30,
          y: yPos - 30,
          size: 14,
          font: boldFont,
          color: colors.primary
        });

        // Chart type indicator
        page.drawText(`Chart Type: ${element.type || 'Data Visualization'}`, {
          x: margins.left + 30,
          y: yPos - 50,
          size: 10,
          font: regularFont,
          color: colors.text
        });

        // Professional chart placeholder
        page.drawText('[Professional Chart Visualization]', {
          x: margins.left + (pageWidth - margins.left - margins.right) / 2 - 100,
          y: yPos - 120,
          size: 12,
          font: boldFont,
          color: colors.secondary
        });

        yPos -= 230;
      });
    }

    return 1;
  }

  private addPageHeader(
    page: any,
    title: string,
    colors: any,
    font: any,
    pageWidth: number,
    margins: any
  ) {
    // Header background
    page.drawRectangle({
      x: 0,
      y: page.getSize().height - 60,
      width: pageWidth,
      height: 60,
      color: colors.accent
    });

    // Header title
    page.drawText(title, {
      x: margins.left,
      y: page.getSize().height - 35,
      size: 18,
      font: font,
      color: colors.primary
    });

    // Header line
    page.drawLine({
      start: { x: margins.left, y: page.getSize().height - 50 },
      end: { x: pageWidth - margins.right, y: page.getSize().height - 50 },
      thickness: 2,
      color: colors.primary
    });
  }

  private async addHeadersAndFooters(
    pdfDoc: PDFDocument,
    options: OfficeOptions,
    branding: OfficeBranding | undefined,
    colors: any,
    font: any,
    pageWidth: number,
    pageHeight: number,
    margins: any
  ) {
    const pages = pdfDoc.getPages();
    
    pages.forEach((page, index) => {
      // Skip title page
      if (index === 0) return;

      // Footer line
      page.drawLine({
        start: { x: margins.left, y: 50 },
        end: { x: pageWidth - margins.right, y: 50 },
        thickness: 1,
        color: colors.border
      });

      // Page number
      page.drawText(`Page ${index + 1} of ${pages.length}`, {
        x: pageWidth - margins.right - 80,
        y: 35,
        size: 10,
        font: font,
        color: colors.text
      });

      // Company name in footer
      if (branding && branding.companyName) {
        page.drawText(branding.companyName, {
          x: margins.left,
          y: 35,
          size: 10,
          font: font,
          color: colors.text
        });
      }

      // Document classification
      page.drawText(`${options.confidentiality.toUpperCase()}`, {
        x: margins.left + 200,
        y: 35,
        size: 10,
        font: font,
        color: options.confidentiality === 'public' ? colors.text : colors.primary
      });
    });
  }

  private async addConfidentialityMarkings(
    pdfDoc: PDFDocument,
    level: string,
    colors: any,
    font: any,
    pageWidth: number,
    pageHeight: number
  ) {
    if (level === 'public') return;

    const pages = pdfDoc.getPages();
    const markingColor = level === 'restricted' ? rgb(0.8, 0.2, 0.2) : colors.primary;

    pages.forEach(page => {
      // Top marking
      page.drawText(level.toUpperCase(), {
        x: pageWidth / 2 - 30,
        y: pageHeight - 20,
        size: 12,
        font: font,
        color: markingColor
      });

      // Bottom marking
      page.drawText(level.toUpperCase(), {
        x: pageWidth / 2 - 30,
        y: 20,
        size: 12,
        font: font,
        color: markingColor
      });
    });
  }

  private addOfficeCornerElements(page: any, width: number, height: number, color: any) {
    // Professional corner brackets
    const cornerSize = 20;
    const thickness = 2;
    
    // Top-left
    page.drawLine({
      start: { x: 20, y: height - 20 },
      end: { x: 20 + cornerSize, y: height - 20 },
      thickness,
      color
    });
    page.drawLine({
      start: { x: 20, y: height - 20 },
      end: { x: 20, y: height - 20 - cornerSize },
      thickness,
      color
    });

    // Top-right
    page.drawLine({
      start: { x: width - 20, y: height - 20 },
      end: { x: width - 20 - cornerSize, y: height - 20 },
      thickness,
      color
    });
    page.drawLine({
      start: { x: width - 20, y: height - 20 },
      end: { x: width - 20, y: height - 20 - cornerSize },
      thickness,
      color
    });

    // Bottom-left
    page.drawLine({
      start: { x: 20, y: 20 },
      end: { x: 20 + cornerSize, y: 20 },
      thickness,
      color
    });
    page.drawLine({
      start: { x: 20, y: 20 },
      end: { x: 20, y: 20 + cornerSize },
      thickness,
      color
    });

    // Bottom-right
    page.drawLine({
      start: { x: width - 20, y: 20 },
      end: { x: width - 20 - cornerSize, y: 20 },
      thickness,
      color
    });
    page.drawLine({
      start: { x: width - 20, y: 20 },
      end: { x: width - 20, y: 20 + cornerSize },
      thickness,
      color
    });
  }

  private wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
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
}

export const officePDFGenerator = new OfficePDFGenerator();