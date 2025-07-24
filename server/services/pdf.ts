
import * as fs from "fs";
import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import type { ProcessedNote } from "@shared/schema";
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export interface PDFGenerationOptions {
  theme: "default" | "academic" | "modern" | "colorful" | "minimal";
  fontSize: number;
  includeHeader: boolean;
  includeFooter?: boolean;
  colorScheme?: "blue" | "green" | "purple" | "orange";
}

interface ColorPalette {
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  text: [number, number, number];
  lightText: [number, number, number];
  background: [number, number, number];
}

const colorSchemes: Record<string, ColorPalette> = {
  blue: {
    primary: [0.2, 0.4, 0.8],
    secondary: [0.4, 0.6, 0.9],
    accent: [0.1, 0.7, 0.9],
    text: [0.1, 0.1, 0.2],
    lightText: [0.4, 0.4, 0.5],
    background: [0.98, 0.99, 1.0]
  },
  green: {
    primary: [0.2, 0.6, 0.4],
    secondary: [0.4, 0.8, 0.6],
    accent: [0.1, 0.9, 0.6],
    text: [0.1, 0.2, 0.1],
    lightText: [0.4, 0.5, 0.4],
    background: [0.98, 1.0, 0.98]
  },
  purple: {
    primary: [0.5, 0.2, 0.8],
    secondary: [0.7, 0.4, 0.9],
    accent: [0.8, 0.3, 0.9],
    text: [0.2, 0.1, 0.2],
    lightText: [0.5, 0.4, 0.5],
    background: [0.99, 0.98, 1.0]
  },
  orange: {
    primary: [0.9, 0.5, 0.2],
    secondary: [1.0, 0.7, 0.4],
    accent: [1.0, 0.6, 0.1],
    text: [0.2, 0.1, 0.0],
    lightText: [0.5, 0.4, 0.3],
    background: [1.0, 0.99, 0.97]
  }
};

export async function generateNotePDF(
  note: ProcessedNote,
  options: PDFGenerationOptions = {
    theme: "modern",
    fontSize: 12,
    includeHeader: true,
    includeFooter: true,
    colorScheme: "blue"
  }
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    
    // Use A4 size for better formatting
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();

    // Load fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Get color scheme with fallback
    const colorScheme = options.colorScheme || "blue";
    const colors = colorSchemes[colorScheme] || colorSchemes["blue"];
    
    const margin = 60;
    let yPosition = height - margin;

    // Enhanced Header with gradient-like effect
    if (options.includeHeader) {
      // Header background rectangle
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: rgb(...colors.background),
      });

      // Decorative line
      page.drawRectangle({
        x: 0,
        y: height - 125,
        width: width,
        height: 5,
        color: rgb(...colors.primary),
      });

      // Main title with enhanced styling
      const titleFontSize = Math.min(options.fontSize + 8, 24);
      page.drawText(note.title, {
        x: margin,
        y: height - 70,
        size: titleFontSize,
        font: boldFont,
        color: rgb(...colors.text),
        maxWidth: width - 2 * margin,
      });

      // Subtitle/metadata with styling
      const metadataText = `Generated: ${new Date(note.metadata.generatedAt).toLocaleDateString()} | Style: ${note.metadata.style}`;
      page.drawText(metadataText, {
        x: margin,
        y: height - 95,
        size: options.fontSize - 2,
        font: italicFont,
        color: rgb(...colors.lightText),
      });

      yPosition = height - 150;
    }

    // Enhanced Key Concepts Section
    if (note.keyConcepts && note.keyConcepts.length > 0) {
      yPosition = await drawSection(
        page,
        "🔑 Key Concepts",
        yPosition,
        colors,
        boldFont,
        regularFont,
        options.fontSize,
        margin,
        width
      );

      for (const [index, concept] of note.keyConcepts.entries()) {
        // Concept card background
        const cardHeight = 60;
        page.drawRectangle({
          x: margin,
          y: yPosition - cardHeight,
          width: width - 2 * margin,
          height: cardHeight,
          color: rgb(...colors.background),
          borderColor: rgb(...colors.secondary),
          borderWidth: 1,
        });

        // Concept number badge
        const badgeSize = 20;
        page.drawCircle({
          x: margin + 15,
          y: yPosition - 20,
          size: badgeSize / 2,
          color: rgb(...colors.accent),
        });

        page.drawText((index + 1).toString(), {
          x: margin + 11,
          y: yPosition - 25,
          size: options.fontSize - 2,
          font: boldFont,
          color: rgb(1, 1, 1),
        });

        // Concept title
        page.drawText(concept.title, {
          x: margin + 40,
          y: yPosition - 20,
          size: options.fontSize + 1,
          font: boldFont,
          color: rgb(...colors.text),
          maxWidth: width - 2 * margin - 50,
        });

        // Concept definition with word wrapping
        const definitionLines = wrapText(concept.definition, width - 2 * margin - 50, regularFont, options.fontSize - 1);
        for (const [lineIndex, line] of definitionLines.entries()) {
          page.drawText(line, {
            x: margin + 40,
            y: yPosition - 35 - (lineIndex * 12),
            size: options.fontSize - 1,
            font: regularFont,
            color: rgb(...colors.lightText),
          });
        }

        yPosition -= cardHeight + 15;
      }
      yPosition -= 20;
    }

    // Enhanced Summary Points Section
    if (note.summaryPoints && note.summaryPoints.length > 0) {
      yPosition = await drawSection(
        page,
        "📋 Summary Points",
        yPosition,
        colors,
        boldFont,
        regularFont,
        options.fontSize,
        margin,
        width
      );

      for (const section of note.summaryPoints) {
        // Section header with background
        page.drawRectangle({
          x: margin,
          y: yPosition - 25,
          width: width - 2 * margin,
          height: 25,
          color: rgb(...colors.secondary),
        });

        page.drawText(section.heading, {
          x: margin + 10,
          y: yPosition - 18,
          size: options.fontSize + 1,
          font: boldFont,
          color: rgb(1, 1, 1),
        });

        yPosition -= 35;

        // Section points with enhanced bullets
        for (const point of section.points) {
          // Custom bullet point
          page.drawCircle({
            x: margin + 15,
            y: yPosition - 5,
            size: 3,
            color: rgb(...colors.accent),
          });

          const pointLines = wrapText(point, width - 2 * margin - 30, regularFont, options.fontSize);
          for (const [lineIndex, line] of pointLines.entries()) {
            page.drawText(line, {
              x: margin + 25,
              y: yPosition - (lineIndex * 15),
              size: options.fontSize,
              font: regularFont,
              color: rgb(...colors.text),
            });
          }

          yPosition -= Math.max(pointLines.length * 15, 20);
        }
        yPosition -= 15;
      }
    }

    // Process Flow Section (if exists)
    if (note.processFlow && note.processFlow.length > 0) {
      yPosition = await drawSection(
        page,
        "🔄 Process Flow",
        yPosition,
        colors,
        boldFont,
        regularFont,
        options.fontSize,
        margin,
        width
      );

      for (const [index, step] of note.processFlow.entries()) {
        // Step connector line (if not first step)
        if (index > 0) {
          page.drawLine({
            start: { x: margin + 20, y: yPosition + 10 },
            end: { x: margin + 20, y: yPosition - 10 },
            thickness: 2,
            color: rgb(...colors.secondary),
          });
        }

        // Step circle
        page.drawCircle({
          x: margin + 20,
          y: yPosition - 20,
          size: 15,
          color: rgb(...colors.primary),
        });

        page.drawText(step.step.toString(), {
          x: margin + 16,
          y: yPosition - 25,
          size: options.fontSize,
          font: boldFont,
          color: rgb(1, 1, 1),
        });

        // Step content
        page.drawText(step.title, {
          x: margin + 50,
          y: yPosition - 15,
          size: options.fontSize + 1,
          font: boldFont,
          color: rgb(...colors.text),
        });

        const descLines = wrapText(step.description, width - 2 * margin - 60, regularFont, options.fontSize - 1);
        for (const [lineIndex, line] of descLines.entries()) {
          page.drawText(line, {
            x: margin + 50,
            y: yPosition - 30 - (lineIndex * 12),
            size: options.fontSize - 1,
            font: regularFont,
            color: rgb(...colors.lightText),
          });
        }

        yPosition -= Math.max(descLines.length * 12 + 40, 60);
      }
    }

    // Enhanced Footer
    if (options.includeFooter) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 40,
        color: rgb(...colors.background),
      });

      page.drawText(`Generated by NoteGPT AI | Page 1`, {
        x: margin,
        y: 15,
        size: options.fontSize - 3,
        font: italicFont,
        color: rgb(...colors.lightText),
      });

      page.drawText(new Date().toLocaleString(), {
        x: width - margin - 100,
        y: 15,
        size: options.fontSize - 3,
        font: italicFont,
        color: rgb(...colors.lightText),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    throw new Error(`Failed to generate enhanced PDF: ${error}`);
  }
}

async function drawSection(
  page: any,
  title: string,
  yPosition: number,
  colors: ColorPalette,
  boldFont: any,
  regularFont: any,
  fontSize: number,
  margin: number,
  width: number
): Promise<number> {
  // Section background
  page.drawRectangle({
    x: margin - 10,
    y: yPosition - 35,
    width: width - 2 * margin + 20,
    height: 35,
    color: rgb(...colors.primary),
  });

  page.drawText(title, {
    x: margin,
    y: yPosition - 22,
    size: fontSize + 3,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  return yPosition - 50;
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (lineWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("Invalid PDF buffer provided");
    }

    // Check if buffer contains PDF magic bytes
    const pdfHeader = buffer.subarray(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      throw new Error("Invalid PDF file format");
    }

    console.log(`PDF will be processed directly by Gemini AI, buffer size: ${buffer.length} bytes`);

    // Return a placeholder - actual extraction will be done by Gemini
    return "PDF_CONTENT_FOR_GEMINI_PROCESSING";

  } catch (error) {
    console.error("PDF validation error:", error);
    throw new Error(`Failed to validate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
