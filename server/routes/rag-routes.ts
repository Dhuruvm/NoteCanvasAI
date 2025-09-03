/**
 * RAG-specific API routes
 * Enhanced routes for RAG capabilities, semantic search, and vector operations
 */

import type { Express } from "express";
import { ragService } from "../services/rag-service";
import { vectorDatabase } from "../services/vector-database";
import { semanticCache } from "../services/semantic-cache";
import { aiOrchestrator } from "../ai/unified-ai-orchestrator";

export function registerRAGRoutes(app: Express): void {
  
  // Initialize RAG context for existing note
  app.post("/api/rag/initialize/:noteId", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { content, settings } = req.body;

      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const ragContext = await ragService.initializeDocumentContext(noteId, content, settings || {
        summaryStyle: 'academic',
        detailLevel: 3,
        includeExamples: true,
        useMultipleModels: true,
        designStyle: 'modern'
      });

      res.json({
        success: true,
        collectionId: ragContext.collectionId,
        chunksProcessed: ragContext.processedStructure?.chunks.length || 0,
        message: "RAG context initialized successfully"
      });

    } catch (error) {
      console.error("RAG initialization error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "RAG initialization failed"
      });
    }
  });

  // Ask question using RAG
  app.post("/api/rag/question/:noteId", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { question, options } = req.body;

      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const result = await ragService.answerQuestion(noteId, question, options || {
        useRAG: true,
        maxContextTokens: 1500,
        similarityThreshold: 0.4,
        rerank: true,
        includeOriginalContent: true,
        enhanceWithWebResearch: false
      });

      res.json({
        success: true,
        answer: result.answer,
        sources: result.sources.map(source => ({
          content: source.chunk.content.substring(0, 300) + '...',
          type: source.chunk.type,
          similarity: Math.round(source.similarity * 1000) / 1000,
          significance: source.chunk.metadata.significance
        })),
        confidence: Math.round(result.confidence * 1000) / 1000,
        processingTime: result.processingTime,
        metadata: result.metadata
      });

    } catch (error) {
      console.error("RAG question error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Question answering failed"
      });
    }
  });

  // Generate study questions using RAG
  app.post("/api/rag/study-questions/:noteId", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { count = 5, difficulty = 'medium' } = req.body;

      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const questions = await ragService.generateStudyQuestions(
        noteId, 
        Math.min(count, 20), // Limit to 20 questions max
        difficulty
      );

      res.json({
        success: true,
        questions: questions.map(q => ({
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty,
          topic: q.topic,
          sources: q.sources.length
        })),
        generated: questions.length,
        message: `Generated ${questions.length} study questions`
      });

    } catch (error) {
      console.error("Study questions generation error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Study questions generation failed"
      });
    }
  });

  // Get similar content using semantic search
  app.post("/api/rag/similar-content/:noteId", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { query, limit = 5 } = req.body;

      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await ragService.getSimilarContent(
        noteId, 
        query, 
        Math.min(limit, 20)
      );

      res.json({
        success: true,
        results: results.map(result => ({
          content: result.chunk.content,
          type: result.chunk.type,
          similarity: Math.round(result.similarity * 1000) / 1000,
          wordCount: result.chunk.metadata.wordCount,
          significance: result.chunk.metadata.significance
        })),
        totalFound: results.length
      });

    } catch (error) {
      console.error("Similar content search error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Similar content search failed"
      });
    }
  });

  // Get vector collection statistics
  app.get("/api/rag/stats/:noteId", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);

      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      // Get collection ID from RAG service context
      const collectionId = `note_${noteId}`;
      const stats = await vectorDatabase.getCollectionStats(collectionId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: "RAG context not found for this note"
        });
      }

      res.json({
        success: true,
        stats: {
          totalChunks: stats.totalChunks,
          averageChunkSize: stats.avgChunkSize,
          embeddingDimension: stats.embeddingDimension,
          lastUpdated: stats.lastUpdated,
          collectionId
        }
      });

    } catch (error) {
      console.error("RAG stats error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get RAG statistics"
      });
    }
  });

  // Semantic cache management
  app.get("/api/rag/cache/stats", async (req, res) => {
    try {
      const cacheStats = await aiOrchestrator.getCacheStats();
      
      res.json({
        success: true,
        stats: cacheStats
      });

    } catch (error) {
      console.error("Cache stats error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get cache statistics"
      });
    }
  });

  // Clear semantic cache by criteria
  app.delete("/api/rag/cache", async (req, res) => {
    try {
      const { tags, model, olderThan } = req.body;
      
      const criteria: any = {};
      if (tags) criteria.tags = tags;
      if (model) criteria.model = model;
      if (olderThan) criteria.olderThan = new Date(olderThan);

      const invalidatedCount = await semanticCache.invalidateCache(criteria);
      
      res.json({
        success: true,
        invalidatedCount,
        message: `Invalidated ${invalidatedCount} cache entries`
      });

    } catch (error) {
      console.error("Cache invalidation error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Cache invalidation failed"
      });
    }
  });

  // List all vector collections
  app.get("/api/rag/collections", async (req, res) => {
    try {
      const collections = vectorDatabase.listCollections();
      
      res.json({
        success: true,
        collections: collections.map(collection => ({
          id: collection.id,
          name: collection.name,
          totalChunks: collection.totalChunks,
          lastUpdated: collection.lastUpdated
        })),
        total: collections.length
      });

    } catch (error) {
      console.error("Collections listing error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to list collections"
      });
    }
  });

  // Delete RAG context and vector collection
  app.delete("/api/rag/:noteId", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);

      if (isNaN(noteId)) {
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const collectionId = `note_${noteId}`;
      const deleted = await vectorDatabase.deleteCollection(collectionId);

      if (deleted) {
        res.json({
          success: true,
          message: "RAG context deleted successfully"
        });
      } else {
        res.status(404).json({
          success: false,
          error: "RAG context not found"
        });
      }

    } catch (error) {
      console.error("RAG deletion error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "RAG context deletion failed"
      });
    }
  });

  // Health check for RAG services
  app.get("/api/rag/health", async (req, res) => {
    try {
      const health = {
        ragService: 'healthy',
        vectorDatabase: 'healthy',
        semanticCache: 'healthy',
        aiOrchestrator: 'healthy'
      };

      // Basic health checks
      const collections = vectorDatabase.listCollections();
      const cacheStats = await semanticCache.getCacheStats();

      res.json({
        success: true,
        health,
        stats: {
          collections: collections.length,
          cacheEntries: cacheStats.totalEntries,
          cacheHitRate: Math.round(cacheStats.hitRate * 1000) / 1000
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("RAG health check error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Health check failed"
      });
    }
  });
}