import { GoogleGenAI } from "@google/genai";
import type { ProcessedNote, AISettings } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export async function summarizeContentWithGemini(
  content: string,
  settings: AISettings,
  pdfBuffer?: Buffer
): Promise<ProcessedNote> {
  try {
    const systemPrompt = `You are an expert educational content analyzer and note generator. 
Your task is to transform the provided content into well-structured study notes.

Based on the settings provided:
- Summary Style: ${settings.summaryStyle}
- Detail Level: ${settings.detailLevel}/5 (1=brief, 5=comprehensive)
- Include Examples: ${settings.includeExamples}

Generate structured study notes following this format:
1. Extract a clear, descriptive title
2. Identify key concepts with definitions
3. Create organized summary points with clear headings
4. If applicable, identify any process flows or sequences

Respond with JSON in the exact format specified by the schema.`;

    let userPrompt: string;
    let contents: any;

    if (pdfBuffer && content === "PDF_CONTENT_FOR_GEMINI_PROCESSING") {
      // Handle PDF directly with Gemini
      console.log("Processing PDF directly with Gemini AI");
      
      userPrompt = `Please analyze and structure the content from this PDF file into comprehensive study notes:

Generate the response following these guidelines:`;

      // Use the PDF buffer directly in the request
      contents = {
        parts: [
          {
            text: userPrompt + `
- Title should be clear and descriptive (max 10 words)
- Key concepts should include 3-5 most important terms with clear definitions
- Summary points should be organized by topic with bullet points (max 3 sections)
- If there are any processes, procedures, or sequential steps, include them in processFlow
- Make the content study-friendly and well-organized
- Keep responses concise and focused`
          },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBuffer.toString('base64')
            }
          }
        ]
      };
    } else {
      // Handle text content
      const maxContentLength = 3000;
      const trimmedContent = content.length > maxContentLength 
        ? content.substring(0, maxContentLength) + "..."
        : content;

      userPrompt = `Please analyze and structure the following content into comprehensive study notes:

${trimmedContent}

Generate the response following these guidelines:`;

      contents = userPrompt + `
- Title should be clear and descriptive (max 10 words)
- Key concepts should include 3-5 most important terms with clear definitions
- Summary points should be organized by topic with bullet points (max 3 sections)
- If there are any processes, procedures, or sequential steps, include them in processFlow
- Make the content study-friendly and well-organized
- Keep responses concise and focused`;
    }

    // Use faster model for better performance
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",

        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            keyConcepts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  definition: { type: "string" }
                },
                required: ["title", "definition"]
              }
            },
            summaryPoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  points: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["heading", "points"]
              }
            },
            processFlow: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" }
                },
                required: ["step", "title", "description"]
              }
            },
            metadata: {
              type: "object",
              properties: {
                source: { type: "string" },
                generatedAt: { type: "string" },
                style: { type: "string" }
              },
              required: ["source", "generatedAt", "style"]
            }
          },
          required: ["title", "keyConcepts", "summaryPoints", "metadata"]
        }
      },
      contents,
    });

    const rawJson = response.text;

    if (!rawJson) {
      throw new Error("Empty response from Gemini AI");
    }

    try {
      const parsedData = JSON.parse(rawJson);
      
      // Ensure metadata is properly set
      const processedNote: ProcessedNote = {
        ...parsedData,
        metadata: {
          source: parsedData.metadata?.source || "User input",
          generatedAt: new Date().toISOString(),
          style: settings.summaryStyle
        }
      };

      // Validate required fields
      if (!processedNote.title || !processedNote.keyConcepts || !processedNote.summaryPoints) {
        throw new Error("Invalid response structure from AI");
      }

      return processedNote;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", rawJson);
      throw new Error(`Failed to parse AI response: ${parseError}`);
    }

  } catch (error) {
    console.error("Gemini AI processing error:", error);
    throw new Error(`Failed to process content with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function enhanceNotesWithExamples(
  processedNote: ProcessedNote,
  originalContent: string
): Promise<ProcessedNote> {
  try {
    const prompt = `Given these structured notes and the original content, enhance the key concepts with relevant examples from the source material.

Original Notes:
${JSON.stringify(processedNote, null, 2)}

Original Content:
${originalContent}

Enhance the key concepts by adding specific examples, quotes, or illustrations from the original content where relevant.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const enhancedContent = response.text;
    
    if (enhancedContent) {
      try {
        return JSON.parse(enhancedContent);
      } catch {
        // If parsing fails, return original
        return processedNote;
      }
    }

    return processedNote;
  } catch (error) {
    console.error("Failed to enhance notes:", error);
    // Return original notes if enhancement fails
    return processedNote;
  }
}

export async function generateStudyQuestions(content: string): Promise<string[]> {
  try {
    const prompt = `Based on the following content, generate 5-8 study questions that would help someone learn and review this material effectively.

Content:
${content}

Generate questions that:
- Test understanding of key concepts
- Encourage critical thinking
- Cover different aspects of the material
- Are suitable for self-study

Return the questions as a simple JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: { type: "string" }
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    }

    return [];
  } catch (error) {
    console.error("Failed to generate study questions:", error);
    return [];
  }
}
