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
    
    // Use PDF.js for reliable text extraction
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Load the PDF document
      const pdfDoc = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        verbosity: 0, // Suppress console logs
      }).promise;
      
      const textParts: string[] = [];
      const numPages = pdfDoc.numPages;
      
      console.log(`PDF has ${numPages} pages, extracting text...`);
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items from the page
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (pageText) {
            textParts.push(pageText);
          }
        } catch (pageError) {
          console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
          textParts.push(`[Page ${pageNum}: Text extraction failed]`);
        }
      }
      
      const extractedText = textParts.join('\n\n').trim();
      
      if (extractedText && extractedText.length > 0) {
        console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
        return extractedText;
      } else {
        throw new Error("No text content found in PDF pages");
      }
      
    } catch (pdfjsError) {
      console.warn("PDF.js extraction failed, trying pdf-lib fallback:", pdfjsError);
      
      try {
        // Fallback to pdf-lib for basic validation
        const { PDFDocument } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        
        console.log(`PDF loaded with ${pages.length} pages using pdf-lib`);
        
        // Return a helpful message for manual processing
        return `PDF successfully processed (${pages.length} pages detected). 
        
The PDF appears to be valid but automatic text extraction is not available for this document type. This may happen with:
- Scanned PDFs (images of text)  
- Complex layouts with embedded graphics
- Password-protected or encrypted PDFs

Please copy and paste the text content manually, or try converting the PDF to a text file first.`;
        
      } catch (libError) {
        console.error("All PDF processing methods failed:", libError);
        throw new Error("Unable to process PDF file. Please ensure it's a valid, unencrypted PDF document.");
      }
    }
    
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
