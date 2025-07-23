
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
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("Invalid PDF buffer provided");
    }

    // Check if buffer contains PDF magic bytes
    const pdfHeader = buffer.subarray(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      throw new Error("Invalid PDF file format");
    }

    console.log(`Starting PDF text extraction, buffer size: ${buffer.length} bytes`);

    // Use pdf-parse for reliable text extraction
    const pdfParse = (await import('pdf-parse')).default;
    
    const data = await pdfParse(buffer, {
      // Options to improve extraction
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });

    console.log(`PDF text extracted successfully: ${data.numpages} pages, ${data.text.length} characters`);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("No readable text found in PDF. This might be a scanned image or encrypted PDF.");
    }

    // Clean up the extracted text
    const cleanedText = data.text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
      .trim();

    if (cleanedText.length < 10) {
      throw new Error("PDF contains very little readable text. Please ensure it's not a scanned image.");
    }

    return cleanedText;

  } catch (error) {
    console.error("PDF extraction error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF structure')) {
        throw new Error("The PDF file appears to be corrupted or encrypted.");
      }
      if (error.message.includes('password')) {
        throw new Error("This PDF is password protected. Please provide an unencrypted PDF.");
      }
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    
    throw new Error("Failed to extract text from PDF: Unknown error occurred");
  }
}
