import * as fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ProcessedNote } from "@shared/schema";

export interface PDFGenerationOptions {
  theme: "default" | "academic" | "colorful";
  fontSize: number;
  includeHeader: boolean;
}

export async function generateNotePDF(
  note: ProcessedNote,
  options: PDFGenerationOptions = {
    theme: "default",
    fontSize: 12,
    includeHeader: true,
  }
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const margin = 50;
    let yPosition = height - margin;
    
    // Title
    if (options.includeHeader) {
      page.drawText(note.title, {
        x: margin,
        y: yPosition,
        size: options.fontSize + 6,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 40;
      
      // Metadata
      page.drawText(`Generated: ${new Date(note.metadata.generatedAt).toLocaleDateString()}`, {
        x: margin,
        y: yPosition,
        size: options.fontSize - 2,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= 30;
    }
    
    // Key Concepts Section
    if (note.keyConcepts && note.keyConcepts.length > 0) {
      page.drawText("Key Concepts", {
        x: margin,
        y: yPosition,
        size: options.fontSize + 2,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.8),
      });
      yPosition -= 25;
      
      for (const concept of note.keyConcepts) {
        // Concept title
        page.drawText(`• ${concept.title}`, {
          x: margin + 10,
          y: yPosition,
          size: options.fontSize,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 18;
        
        // Concept definition
        const words = concept.definition.split(' ');
        let line = '';
        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const lineWidth = font.widthOfTextAtSize(testLine, options.fontSize);
          
          if (lineWidth > width - margin * 2 - 20) {
            page.drawText(line, {
              x: margin + 20,
              y: yPosition,
              size: options.fontSize - 1,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
            yPosition -= 15;
            line = word;
          } else {
            line = testLine;
          }
        }
        if (line) {
          page.drawText(line, {
            x: margin + 20,
            y: yPosition,
            size: options.fontSize - 1,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPosition -= 20;
        }
      }
      yPosition -= 10;
    }
    
    // Summary Points Section
    if (note.summaryPoints && note.summaryPoints.length > 0) {
      page.drawText("Summary Points", {
        x: margin,
        y: yPosition,
        size: options.fontSize + 2,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.8),
      });
      yPosition -= 25;
      
      for (const section of note.summaryPoints) {
        // Section heading
        page.drawText(section.heading, {
          x: margin + 10,
          y: yPosition,
          size: options.fontSize + 1,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 20;
        
        // Section points
        for (const point of section.points) {
          const bulletPoint = `  ✓ ${point}`;
          const words = bulletPoint.split(' ');
          let line = '';
          
          for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const lineWidth = font.widthOfTextAtSize(testLine, options.fontSize);
            
            if (lineWidth > width - margin * 2 - 20) {
              page.drawText(line, {
                x: margin + 20,
                y: yPosition,
                size: options.fontSize - 1,
                font,
                color: rgb(0.3, 0.3, 0.3),
              });
              yPosition -= 15;
              line = word;
            } else {
              line = testLine;
            }
          }
          if (line) {
            page.drawText(line, {
              x: margin + 20,
              y: yPosition,
              size: options.fontSize - 1,
              font,
              color: rgb(0.3, 0.3, 0.3),
            });
            yPosition -= 15;
          }
        }
        yPosition -= 10;
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error}`);
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use pdf-parse for text extraction
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}
