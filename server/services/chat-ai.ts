import { GoogleGenAI } from "@google/genai";
import type { ChatContext, QuestionPrediction, RewardSystem, ChatMessage } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export class ChatWithPDFService {
  
  async generateResponse(
    userMessage: string, 
    context: ChatContext, 
    chatHistory: ChatMessage[]
  ): Promise<{
    response: string;
    messageType: "text" | "question" | "answer" | "quiz" | "explanation" | "research";
    metadata?: any;
  }> {
    try {
      const contextPrompt = this.buildContextPrompt(context, chatHistory);
      
      const systemPrompt = `You are an advanced AI tutor specialized in helping users understand PDF documents through interactive conversation. 

Your capabilities:
1. Answer questions about the PDF content with detailed explanations
2. Ask probing questions to test understanding
3. Provide examples and analogies to clarify concepts
4. Adapt explanations based on user level (${context.userLevel})
5. Generate follow-up questions to deepen learning
6. Research additional context when needed

Rules:
- Always be encouraging and supportive
- Adapt complexity to user level: ${context.userLevel}
- Use the PDF content as primary source but enhance with your knowledge
- Ask thought-provoking questions to test understanding
- Provide step-by-step explanations for complex topics
- Use examples and real-world applications
- If user seems confused, simplify and provide more examples

Current user progress: ${context.userProgress.correctAnswers}/${context.userProgress.totalQuestions} correct, ${context.userProgress.currentStreak} streak, Level ${context.userProgress.level}`;

      const userPrompt = `PDF Content Context: ${context.noteContent.substring(0, 2000)}...

Current Topic: ${context.currentTopic}

User Message: ${userMessage}

${contextPrompt}

Respond naturally as a tutor. If the user asks a question, provide a thorough explanation. If they seem to understand, ask a follow-up question to test their knowledge.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              response: { type: "string" },
              messageType: { 
                type: "string", 
                enum: ["text", "question", "answer", "quiz", "explanation", "research"] 
              },
              confidence: { type: "number" },
              suggestedFollowUp: { type: "string" },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
            },
            required: ["response", "messageType"]
          }
        },
        contents: userPrompt,
      });

      const result = JSON.parse(response.text || '{}');
      
      return {
        response: result.response || "I'm here to help you understand the content. What would you like to know?",
        messageType: result.messageType || "text",
        metadata: {
          confidence: result.confidence || 0.8,
          suggestedFollowUp: result.suggestedFollowUp,
          difficulty: result.difficulty || "medium"
        }
      };

    } catch (error) {
      console.error("Chat AI error:", error);
      return {
        response: "I apologize, but I'm having trouble processing your message right now. Could you please try rephrasing your question?",
        messageType: "text",
        metadata: { error: true }
      };
    }
  }

  async predictImportantQuestions(
    noteContent: string,
    subject?: string,
    difficulty: "beginner" | "intermediate" | "advanced" = "intermediate"
  ): Promise<QuestionPrediction[]> {
    try {
      const systemPrompt = `You are an expert educator who predicts the most important questions students should know about academic content.

Your task: Analyze the provided content and predict 8-12 critical questions that:
1. Test key concepts and understanding
2. Are appropriate for ${difficulty} level students
3. Cover different cognitive levels (recall, comprehension, application, analysis)
4. Are likely to appear in exams or academic discussions
5. Help students master the subject matter

For each question, provide:
- The question itself
- A comprehensive answer
- Difficulty level (easy/medium/hard)
- Topic category
- Importance rating (1-10)
- Educational reasoning for why this question matters`;

      const userPrompt = `Subject: ${subject || "Academic Content"}
Difficulty Level: ${difficulty}

Content to analyze:
${noteContent.substring(0, 3000)}

Generate important questions that students should be able to answer after studying this content. Focus on:
- Core concepts and definitions
- Practical applications
- Critical thinking questions
- Connections between ideas
- Real-world relevance`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    topic: { type: "string" },
                    importance: { type: "number" },
                    reasoning: { type: "string" }
                  },
                  required: ["question", "answer", "difficulty", "topic", "importance", "reasoning"]
                }
              }
            },
            required: ["questions"]
          }
        },
        contents: userPrompt,
      });

      const result = JSON.parse(response.text || '{"questions": []}');
      return result.questions || [];

    } catch (error) {
      console.error("Question prediction error:", error);
      return [];
    }
  }

  async generateQuizQuestion(
    context: ChatContext,
    previousQuestions: string[] = []
  ): Promise<{
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    topic: string;
  }> {
    try {
      const systemPrompt = `Generate a quiz question based on the PDF content that:
1. Is appropriate for ${context.userLevel} level
2. Tests understanding of key concepts
3. Hasn't been asked before (avoid: ${previousQuestions.join(", ")})
4. Includes multiple choice options (4 options)
5. Provides detailed explanation

Adapt difficulty based on user performance:
- Recent streak: ${context.userProgress.currentStreak}
- Success rate: ${context.userProgress.correctAnswers}/${context.userProgress.totalQuestions}
- Current level: ${context.userProgress.level}`;

      const userPrompt = `PDF Content: ${context.noteContent.substring(0, 2000)}
Current Topic: ${context.currentTopic}
User Level: ${context.userLevel}

Create an engaging quiz question that helps the user learn and retain information.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: {
                type: "array",
                items: { type: "string" }
              },
              correctAnswer: { type: "string" },
              explanation: { type: "string" },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              topic: { type: "string" }
            },
            required: ["question", "options", "correctAnswer", "explanation", "difficulty", "topic"]
          }
        },
        contents: userPrompt,
      });

      const result = JSON.parse(response.text || '{}');
      return {
        question: result.question || "What is the main concept discussed in this content?",
        options: result.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: result.correctAnswer || "Option A",
        explanation: result.explanation || "This question tests basic comprehension.",
        difficulty: result.difficulty || "medium",
        topic: result.topic || "General"
      };

    } catch (error) {
      console.error("Quiz generation error:", error);
      return {
        question: "What is the main topic of this content?",
        options: ["Topic A", "Topic B", "Topic C", "Topic D"],
        correctAnswer: "Topic A",
        explanation: "Basic comprehension question.",
        difficulty: "easy",
        topic: "General"
      };
    }
  }

  calculateRewards(
    isCorrect: boolean,
    difficulty: "easy" | "medium" | "hard",
    currentStreak: number,
    timeTaken: number,
    userLevel: number
  ): RewardSystem {
    let basePoints = 0;
    let penalties = 0;
    let encouragement = "";
    
    // Base points by difficulty
    switch (difficulty) {
      case "easy": basePoints = 10; break;
      case "medium": basePoints = 20; break;
      case "hard": basePoints = 35; break;
    }

    if (isCorrect) {
      // Correct answer rewards
      let pointsEarned = basePoints;
      
      // Time bonus (faster answers get bonus)
      if (timeTaken < 30) pointsEarned += 5;
      else if (timeTaken < 60) pointsEarned += 3;
      
      // Streak bonus
      let streakBonus = 0;
      if (currentStreak >= 5) streakBonus = Math.floor(currentStreak / 5) * 10;
      
      // Level bonus
      pointsEarned += Math.floor(userLevel / 2);
      
      // Encouragement messages
      if (currentStreak >= 10) {
        encouragement = "Amazing streak! You're on fire! 🔥";
      } else if (currentStreak >= 5) {
        encouragement = "Great streak going! Keep it up!";
      } else if (currentStreak >= 3) {
        encouragement = "Nice momentum! You're getting the hang of this!";
      } else {
        encouragement = "Well done! Correct answer!";
      }
      
      return {
        pointsEarned: pointsEarned + streakBonus,
        streakBonus,
        levelUp: (pointsEarned + streakBonus) >= (userLevel * 100),
        newBadges: this.checkForNewBadges(currentStreak, pointsEarned + streakBonus),
        penalties: 0,
        encouragement
      };
      
    } else {
      // Wrong answer penalties
      penalties = Math.floor(basePoints / 4); // 25% point penalty
      
      if (currentStreak >= 5) {
        encouragement = "Don't worry! Even experts make mistakes. Review the concept and try again.";
      } else {
        encouragement = "Not quite right, but that's how we learn! Let's review this together.";
      }
      
      return {
        pointsEarned: 0,
        streakBonus: 0,
        levelUp: false,
        newBadges: [],
        penalties,
        encouragement
      };
    }
  }

  private checkForNewBadges(streak: number, totalPoints: number): string[] {
    const badges: string[] = [];
    
    if (streak === 5) badges.push("First Streak");
    if (streak === 10) badges.push("Streak Master");
    if (streak === 20) badges.push("Unstoppable");
    if (totalPoints >= 1000) badges.push("Knowledge Seeker");
    if (totalPoints >= 5000) badges.push("Expert Learner");
    
    return badges;
  }

  private buildContextPrompt(context: ChatContext, chatHistory: ChatMessage[]): string {
    const recentHistory = chatHistory
      .slice(-6) // Last 6 messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

    return `
Recent conversation:
${recentHistory}

Previous questions asked: ${context.previousQuestions ? context.previousQuestions.slice(-5).join(", ") : "None"}
`;
  }

  async researchAdditionalContext(
    topic: string,
    userQuestion: string
  ): Promise<{
    enhancedResponse: string;
    sources: Array<{
      title: string;
      snippet: string;
      relevance: number;
    }>;
  }> {
    try {
      // Use AI to generate enhanced context (simulating web research)
      const systemPrompt = `You are a research assistant helping to provide additional context for educational topics.

Given a topic and user question, provide:
1. Enhanced explanation with broader context
2. Real-world examples and applications
3. Current relevance and importance
4. Connections to related concepts

Be thorough but accessible for students.`;

      const userPrompt = `Topic: ${topic}
User Question: ${userQuestion}

Provide comprehensive context and examples that would help a student better understand this topic.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              enhancedResponse: { type: "string" },
              keyPoints: {
                type: "array",
                items: { type: "string" }
              },
              realWorldExamples: {
                type: "array", 
                items: { type: "string" }
              },
              relatedConcepts: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["enhancedResponse"]
          }
        },
        contents: userPrompt,
      });

      const result = JSON.parse(response.text || '{}');
      
      return {
        enhancedResponse: result.enhancedResponse || "Additional context research is temporarily unavailable.",
        sources: [
          {
            title: "Enhanced Context",
            snippet: result.enhancedResponse?.substring(0, 200) + "...",
            relevance: 0.9
          }
        ]
      };

    } catch (error) {
      console.error("Research error:", error);
      return {
        enhancedResponse: "I'm currently unable to research additional context, but I can help with the content from your PDF.",
        sources: []
      };
    }
  }
}

export const chatAIService = new ChatWithPDFService();