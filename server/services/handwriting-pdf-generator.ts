// Revolutionary Handwriting-Style PDF Generator
// Creates natural-looking handwritten documents with AI-enhanced styling

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { ADVANCED_PDF_STYLES, AdvancedPDFStyle, advancedPDFOrchestrator } from './advanced-pdf-architect';

export interface HandwritingOptions {
  style: 'casual' | 'elegant' | 'notebook' | 'journal' | 'creative';
  penType: 'ballpoint' | 'fountain' | 'marker' | 'pencil' | 'gel';
  paperStyle: 'lined' | 'grid' | 'blank' | 'dotted' | 'legal';
  margins: boolean;
  decorations: boolean;
  personalTouch: boolean;
}

export interface HandwritingEffect {
  letterVariation: number;
  slantAngle: number;
  pressureVariation: number;
  inkFlow: 'smooth' | 'textured' | 'vintage';
  naturalSpacing: boolean;
}

export class HandwritingPDFGenerator {
  private effects: Map<string, HandwritingEffect> = new Map();

  constructor() {
    this.initializeHandwritingEffects();
  }

  private initializeHandwritingEffects() {
    this.effects.set('casual', {
      letterVariation: 0.15,
      slantAngle: 5,
      pressureVariation: 0.2,
      inkFlow: 'smooth',
      naturalSpacing: true
    });

    this.effects.set('elegant', {
      letterVariation: 0.08,
      slantAngle: 12,
      pressureVariation: 0.3,
      inkFlow: 'textured',
      naturalSpacing: true
    });

    this.effects.set('notebook', {
      letterVariation: 0.12,
      slantAngle: 3,
      pressureVariation: 0.15,
      inkFlow: 'smooth',
      naturalSpacing: false
    });

    this.effects.set('journal', {
      letterVariation: 0.18,
      slantAngle: 8,
      pressureVariation: 0.25,
      inkFlow: 'vintage',
      naturalSpacing: true
    });

    this.effects.set('creative', {
      letterVariation: 0.25,
      slantAngle: 15,
      pressureVariation: 0.4,
      inkFlow: 'textured',
      naturalSpacing: true
    });
  }

  async generateHandwritingPDF(
    note: any,
    originalContent: string,
    options: HandwritingOptions
  ): Promise<{ buffer: Buffer; metadata: any }> {
    const startTime = Date.now();
    console.log(`✍️ Generating handwriting-style PDF: ${options.style}`);

    // Get the handwriting style configuration
    const styleKey = options.style === 'casual' ? 'handwriting-casual' : 'handwriting-elegant';
    const style = ADVANCED_PDF_STYLES[styleKey];
    const effect = this.effects.get(options.style) || this.effects.get('casual')!;

    // Process with AI orchestrator
    const aiResults = await advancedPDFOrchestrator.processWithAllModels(note, style);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Load fonts for handwriting simulation
    const baseFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const pageWidth = 595.28; // A4 width
    const pageHeight = 841.89; // A4 height
    const margins = style.layout.margins;

    // Create the first page with paper style
    const page = await this.createHandwritingPage(pdfDoc, options.paperStyle, pageWidth, pageHeight);
    
    // Apply handwriting colors (ink colors)
    const inkColors = this.getInkColors(options.penType);
    const paperColor = this.getPaperColor(options.paperStyle);

    // Add paper background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: paperColor
    });

    // Draw paper lines/grid if applicable
    await this.drawPaperGuides(page, options.paperStyle, pageWidth, pageHeight, inkColors.guideline);

    let yPos = pageHeight - margins.top;

    // Title with handwriting effect
    if (note.title) {
      yPos = await this.drawHandwrittenTitle(
        page, 
        note.title, 
        margins.left, 
        yPos, 
        pageWidth - margins.left - margins.right,
        boldFont,
        inkColors.primary,
        effect,
        style.fonts.title.size
      );
      yPos -= 40;
    }

    // Date and decorative elements
    if (options.personalTouch) {
      yPos = await this.addPersonalTouches(
        page,
        margins.left,
        yPos,
        pageWidth - margins.left - margins.right,
        baseFont,
        inkColors.secondary,
        effect
      );
      yPos -= 30;
    }

    // Content sections with handwriting styling
    const processedContent = note.processedContent || {};

    // Key Concepts in handwriting style
    if (processedContent.keyConcepts && processedContent.keyConcepts.length > 0) {
      yPos = await this.drawHandwrittenSection(
        page,
        'Key Concepts',
        processedContent.keyConcepts,
        margins.left,
        yPos,
        pageWidth - margins.left - margins.right,
        baseFont,
        boldFont,
        inkColors,
        effect,
        'concepts'
      );
      yPos -= 30;
    }

    // Summary Points in handwriting style
    if (processedContent.summaryPoints && processedContent.summaryPoints.length > 0) {
      yPos = await this.drawHandwrittenSection(
        page,
        'Summary Points',
        processedContent.summaryPoints,
        margins.left,
        yPos,
        pageWidth - margins.left - margins.right,
        baseFont,
        boldFont,
        inkColors,
        effect,
        'summary'
      );
      yPos -= 30;
    }

    // Original content if no structured content
    if ((!processedContent.keyConcepts || processedContent.keyConcepts.length === 0) && 
        (!processedContent.summaryPoints || processedContent.summaryPoints.length === 0)) {
      yPos = await this.drawHandwrittenContent(
        page,
        originalContent || note.originalContent || 'No content available',
        margins.left,
        yPos,
        pageWidth - margins.left - margins.right,
        baseFont,
        inkColors.primary,
        effect
      );
    }

    // Add decorative elements if enabled
    if (options.decorations) {
      await this.addHandwritingDecorations(
        page,
        pageWidth,
        pageHeight,
        margins,
        inkColors.accent,
        effect
      );
    }

    // Add signature-like element at the bottom
    if (options.personalTouch) {
      await this.addSignatureElement(
        page,
        pageWidth - margins.right - 150,
        margins.bottom + 20,
        italicFont,
        inkColors.secondary
      );
    }

    const pdfBytes = await pdfDoc.save();
    const processingTime = Date.now() - startTime;

    return {
      buffer: Buffer.from(pdfBytes),
      metadata: {
        style: `handwriting-${options.style}`,
        penType: options.penType,
        paperStyle: options.paperStyle,
        processingTime,
        pages: 1,
        aiModelsUsed: aiResults.metadata.modelsUsed,
        handwritingEffects: effect,
        personalizations: {
          decorations: options.decorations,
          personalTouch: options.personalTouch,
          margins: options.margins
        }
      }
    };
  }

  private async createHandwritingPage(
    pdfDoc: PDFDocument, 
    paperStyle: string, 
    width: number, 
    height: number
  ) {
    return pdfDoc.addPage([width, height]);
  }

  private getInkColors(penType: string) {
    const inkColorSchemes = {
      ballpoint: {
        primary: rgb(0.1, 0.2, 0.8),      // Blue ink
        secondary: rgb(0.2, 0.3, 0.7),    // Slightly darker blue
        accent: rgb(0.6, 0.7, 0.9),       // Light blue
        guideline: rgb(0.8, 0.9, 1.0)    // Very light blue
      },
      fountain: {
        primary: rgb(0.05, 0.05, 0.4),    // Dark blue-black
        secondary: rgb(0.1, 0.1, 0.5),    // Navy
        accent: rgb(0.5, 0.6, 0.8),       // Medium blue
        guideline: rgb(0.9, 0.9, 0.95)   // Almost white
      },
      marker: {
        primary: rgb(0.2, 0.2, 0.2),      // Dark gray
        secondary: rgb(0.3, 0.3, 0.3),    // Medium gray
        accent: rgb(0.7, 0.7, 0.7),       // Light gray
        guideline: rgb(0.95, 0.95, 0.95) // Very light gray
      },
      pencil: {
        primary: rgb(0.25, 0.25, 0.25),   // Graphite gray
        secondary: rgb(0.35, 0.35, 0.35), // Darker gray
        accent: rgb(0.8, 0.8, 0.8),       // Light gray
        guideline: rgb(0.92, 0.92, 0.92) // Paper-like gray
      },
      gel: {
        primary: rgb(0.0, 0.0, 0.0),      // Pure black
        secondary: rgb(0.1, 0.1, 0.1),    // Near black
        accent: rgb(0.6, 0.6, 0.6),       // Medium gray
        guideline: rgb(0.88, 0.88, 0.88) // Light gray
      }
    };

    return inkColorSchemes[penType as keyof typeof inkColorSchemes] || inkColorSchemes.ballpoint;
  }

  private getPaperColor(paperStyle: string) {
    const paperColors = {
      lined: rgb(1.0, 1.0, 0.98),     // Cream white
      grid: rgb(0.98, 0.99, 1.0),     // Cool white
      blank: rgb(1.0, 1.0, 1.0),      // Pure white
      dotted: rgb(0.99, 0.99, 0.98),  // Warm white
      legal: rgb(1.0, 1.0, 0.94)      // Yellow legal pad
    };

    return paperColors[paperStyle as keyof typeof paperColors] || paperColors.blank;
  }

  private async drawPaperGuides(
    page: any, 
    paperStyle: string, 
    width: number, 
    height: number, 
    guidelineColor: any
  ) {
    const margin = 60;
    
    switch (paperStyle) {
      case 'lined':
        // Draw horizontal lines
        for (let y = height - 80; y > 60; y -= 25) {
          page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 0.5,
            color: guidelineColor
          });
        }
        
        // Red margin line
        page.drawLine({
          start: { x: margin + 40, y: height - 40 },
          end: { x: margin + 40, y: 40 },
          thickness: 1,
          color: rgb(1.0, 0.7, 0.7)
        });
        break;

      case 'grid':
        // Draw grid
        const gridSpacing = 20;
        
        // Vertical lines
        for (let x = margin; x < width - margin; x += gridSpacing) {
          page.drawLine({
            start: { x, y: height - margin },
            end: { x, y: margin },
            thickness: 0.3,
            color: guidelineColor
          });
        }
        
        // Horizontal lines
        for (let y = height - margin; y > margin; y -= gridSpacing) {
          page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 0.3,
            color: guidelineColor
          });
        }
        break;

      case 'dotted':
        // Draw dot grid
        const dotSpacing = 15;
        for (let x = margin; x < width - margin; x += dotSpacing) {
          for (let y = height - margin; y > margin; y -= dotSpacing) {
            page.drawCircle({
              x,
              y,
              size: 0.5,
              color: guidelineColor
            });
          }
        }
        break;

      case 'legal':
        // Legal pad style with wide lines
        for (let y = height - 100; y > 80; y -= 32) {
          page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 0.8,
            color: rgb(0.9, 0.9, 1.0)
          });
        }
        
        // Red margin line (wider for legal)
        page.drawLine({
          start: { x: margin + 60, y: height - 50 },
          end: { x: margin + 60, y: 50 },
          thickness: 1.5,
          color: rgb(1.0, 0.6, 0.6)
        });
        break;
    }
  }

  private async drawHandwrittenTitle(
    page: any,
    title: string,
    x: number,
    y: number,
    maxWidth: number,
    font: any,
    color: any,
    effect: HandwritingEffect,
    baseSize: number
  ): Promise<number> {
    // Simulate handwriting irregularities
    const words = title.split(' ');
    let currentX = x + 20; // Slight indent for handwriting
    let currentY = y;

    words.forEach((word, index) => {
      // Add natural spacing variations
      if (index > 0) currentX += 8 + Math.random() * 4;
      
      // Simulate letter-by-letter positioning
      for (let i = 0; i < word.length; i++) {
        const letter = word[i];
        
        // Apply handwriting effects
        const letterX = currentX + (Math.random() - 0.5) * effect.letterVariation * 2;
        const letterY = currentY + (Math.random() - 0.5) * effect.letterVariation;
        const letterSize = baseSize + (Math.random() - 0.5) * 2;
        const rotation = (Math.random() - 0.5) * effect.slantAngle;

        page.drawText(letter, {
          x: letterX,
          y: letterY,
          size: letterSize,
          font: font,
          color: color,
          rotate: degrees(rotation)
        });

        currentX += font.widthOfTextAtSize(letter, letterSize) + 1;
      }

      currentX += 12; // Space between words
    });

    // Add underline with handwriting style
    const underlineY = currentY - 8;
    const segments = 5;
    const segmentWidth = (title.length * 8) / segments;
    
    for (let i = 0; i < segments; i++) {
      const startX = x + 20 + (i * segmentWidth);
      const endX = startX + segmentWidth + (Math.random() - 0.5) * 4;
      const startY = underlineY + (Math.random() - 0.5) * 2;
      const endY = underlineY + (Math.random() - 0.5) * 2;
      
      page.drawLine({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        thickness: 1 + Math.random() * 0.5,
        color: color
      });
    }

    return currentY - 30;
  }

  private async addPersonalTouches(
    page: any,
    x: number,
    y: number,
    maxWidth: number,
    font: any,
    color: any,
    effect: HandwritingEffect
  ): Promise<number> {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    // Draw date with handwriting style
    page.drawText(dateStr, {
      x: x + 20 + Math.random() * 10,
      y: y + Math.random() * 4,
      size: 12 + Math.random() * 2,
      font: font,
      color: color,
      rotate: degrees((Math.random() - 0.5) * effect.slantAngle * 0.5)
    });

    // Add a small decorative doodle
    const doodleX = x + maxWidth - 100;
    const doodleY = y;
    
    // Draw a simple star doodle
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144) * Math.PI / 180;
      const innerAngle = ((i * 144) + 72) * Math.PI / 180;
      const outerRadius = 8;
      const innerRadius = 4;
      
      const x1 = doodleX + Math.cos(angle) * outerRadius;
      const y1 = doodleY + Math.sin(angle) * outerRadius;
      const x2 = doodleX + Math.cos(innerAngle) * innerRadius;
      const y2 = doodleY + Math.sin(innerAngle) * innerRadius;
      
      page.drawLine({
        start: { x: doodleX, y: doodleY },
        end: { x: x1, y: y1 },
        thickness: 0.8,
        color: color
      });
    }

    return y - 25;
  }

  private async drawHandwrittenSection(
    page: any,
    sectionTitle: string,
    sectionData: any[],
    x: number,
    y: number,
    maxWidth: number,
    bodyFont: any,
    boldFont: any,
    colors: any,
    effect: HandwritingEffect,
    sectionType: string
  ): Promise<number> {
    let currentY = y;

    // Section heading with handwriting style
    page.drawText(sectionTitle, {
      x: x + 15 + Math.random() * 5,
      y: currentY + Math.random() * 3,
      size: 16 + Math.random() * 2,
      font: boldFont,
      color: colors.primary,
      rotate: degrees((Math.random() - 0.5) * effect.slantAngle * 0.7)
    });

    currentY -= 25;

    // Underline with handwriting style
    page.drawLine({
      start: { x: x + 15, y: currentY + 10 },
      end: { x: x + 15 + sectionTitle.length * 9, y: currentY + 10 + Math.random() * 2 },
      thickness: 1.2,
      color: colors.primary
    });

    currentY -= 20;

    // Draw section content
    sectionData.slice(0, 5).forEach((item, index) => {
      const bulletX = x + 30 + Math.random() * 3;
      const bulletY = currentY + Math.random() * 2;
      
      // Handwritten bullet point
      page.drawCircle({
        x: bulletX,
        y: bulletY,
        size: 2 + Math.random() * 0.5,
        color: colors.secondary
      });

      // Item text
      let text = '';
      if (sectionType === 'concepts') {
        text = `${item.title || item.concept || `Item ${index + 1}`}`;
        if (item.definition) {
          text += ` - ${item.definition.substring(0, 80)}...`;
        }
      } else if (sectionType === 'summary') {
        text = item.heading || `${index + 1}. Summary point`;
      }

      // Wrap and draw text with handwriting effects
      const wrappedText = this.wrapHandwrittenText(text, maxWidth - 60, bodyFont, 11);
      let textY = currentY;
      
      wrappedText.slice(0, 2).forEach(line => {
        page.drawText(line, {
          x: bulletX + 15 + Math.random() * 2,
          y: textY + Math.random() * 1.5,
          size: 11 + Math.random() * 1,
          font: bodyFont,
          color: colors.primary,
          rotate: degrees((Math.random() - 0.5) * effect.slantAngle * 0.3)
        });
        textY -= 14;
      });

      currentY = textY - 8;
    });

    return currentY;
  }

  private async drawHandwrittenContent(
    page: any,
    content: string,
    x: number,
    y: number,
    maxWidth: number,
    font: any,
    color: any,
    effect: HandwritingEffect
  ): Promise<number> {
    const wrappedContent = this.wrapHandwrittenText(content, maxWidth - 40, font, 12);
    let currentY = y;

    wrappedContent.slice(0, 25).forEach(line => {
      page.drawText(line, {
        x: x + 20 + Math.random() * 4,
        y: currentY + Math.random() * 2,
        size: 12 + Math.random() * 1,
        font: font,
        color: color,
        rotate: degrees((Math.random() - 0.5) * effect.slantAngle * 0.4)
      });
      currentY -= 16;
    });

    return currentY;
  }

  private async addHandwritingDecorations(
    page: any,
    width: number,
    height: number,
    margins: any,
    accentColor: any,
    effect: HandwritingEffect
  ) {
    // Corner flourishes
    const cornerSize = 15;
    
    // Top-left corner
    this.drawCornerFlourish(page, margins.left, height - margins.top, cornerSize, accentColor);
    
    // Top-right corner
    this.drawCornerFlourish(page, width - margins.right, height - margins.top, cornerSize, accentColor);

    // Random margin doodles
    for (let i = 0; i < 3; i++) {
      const doodleX = margins.left / 2;
      const doodleY = height - 200 - (i * 150) + Math.random() * 50;
      this.drawMarginDoodle(page, doodleX, doodleY, accentColor);
    }
  }

  private drawCornerFlourish(page: any, x: number, y: number, size: number, color: any) {
    // Simple decorative corner element
    page.drawLine({
      start: { x: x - size, y },
      end: { x: x + size, y },
      thickness: 1,
      color: color
    });
    
    page.drawLine({
      start: { x, y: y - size },
      end: { x, y: y + size },
      thickness: 1,
      color: color
    });
    
    // Add small decorative circles
    page.drawCircle({
      x: x - size/2,
      y: y + size/2,
      size: 1.5,
      color: color
    });
    
    page.drawCircle({
      x: x + size/2,
      y: y - size/2,
      size: 1.5,
      color: color
    });
  }

  private drawMarginDoodle(page: any, x: number, y: number, color: any) {
    // Random margin doodles - hearts, stars, arrows
    const doodleType = Math.floor(Math.random() * 3);
    
    switch (doodleType) {
      case 0: // Heart
        page.drawCircle({ x: x - 3, y: y + 2, size: 3, color: color });
        page.drawCircle({ x: x + 3, y: y + 2, size: 3, color: color });
        page.drawLine({
          start: { x: x - 5, y },
          end: { x, y: y - 6 },
          thickness: 1,
          color: color
        });
        page.drawLine({
          start: { x: x + 5, y },
          end: { x, y: y - 6 },
          thickness: 1,
          color: color
        });
        break;
        
      case 1: // Star
        for (let i = 0; i < 5; i++) {
          const angle = (i * 72) * Math.PI / 180;
          const x1 = x + Math.cos(angle) * 5;
          const y1 = y + Math.sin(angle) * 5;
          page.drawLine({
            start: { x, y },
            end: { x: x1, y: y1 },
            thickness: 0.8,
            color: color
          });
        }
        break;
        
      case 2: // Arrow
        page.drawLine({
          start: { x: x - 6, y },
          end: { x: x + 6, y },
          thickness: 1,
          color: color
        });
        page.drawLine({
          start: { x: x + 6, y },
          end: { x: x + 3, y: y + 3 },
          thickness: 1,
          color: color
        });
        page.drawLine({
          start: { x: x + 6, y },
          end: { x: x + 3, y: y - 3 },
          thickness: 1,
          color: color
        });
        break;
    }
  }

  private async addSignatureElement(
    page: any,
    x: number,
    y: number,
    font: any,
    color: any
  ) {
    // Simulated signature line
    page.drawLine({
      start: { x, y },
      end: { x: x + 120, y: y + Math.random() * 2 },
      thickness: 0.8,
      color: color
    });

    // "Generated by NoteGPT" in handwriting style
    page.drawText('~ NoteGPT ~', {
      x: x + 20,
      y: y + 10,
      size: 9,
      font: font,
      color: color,
      rotate: degrees((Math.random() - 0.5) * 3)
    });
  }

  private wrapHandwrittenText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
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

export const handwritingPDFGenerator = new HandwritingPDFGenerator();