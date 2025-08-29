import Queue from 'bull';
import IORedis from 'ioredis';
import { aiOrchestrator } from '../ai/unified-ai-orchestrator';
import { storage } from '../storage';
import { metricsCollector } from '../monitoring/metrics';
import type { AISettings } from '@shared/schema';

// Redis configuration with fallback handling
let redisConfig: any = null;
let redisAvailable = false;

if (process.env.REDIS_URL) {
  redisConfig = {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  };
  redisAvailable = true;
} else {
  console.log('🔄 Redis not available for queue system, using in-memory processing');
}

// Job types
interface AIProcessingJob {
  noteId: number;
  content: string;
  settings: AISettings;
  pdfBuffer?: Buffer;
  userId?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface PDFGenerationJob {
  noteId: number;
  options: any;
  userId?: string;
}

interface EmailNotificationJob {
  userId: string;
  type: 'processing_complete' | 'processing_failed';
  noteId: number;
}

// Queue setup with different priorities
class JobProcessor {
  private aiQueue: Queue.Queue<AIProcessingJob>;
  private pdfQueue: Queue.Queue<PDFGenerationJob>;
  private notificationQueue: Queue.Queue<EmailNotificationJob>;

  constructor() {
    if (!redisAvailable) {
      console.log('🔄 Queue system disabled - Redis not available');
      return;
    }

    // AI Processing Queue (High priority, resource intensive)
    this.aiQueue = new Queue<AIProcessingJob>('AI Processing', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
      },
      settings: {
        stalledInterval: 30 * 1000,  // 30 seconds
        maxStalledCount: 3,
        retryProcessDelay: 5 * 1000, // 5 seconds
      },
    });

    // PDF Generation Queue (Medium priority)
    this.pdfQueue = new Queue<PDFGenerationJob>('PDF Generation', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      },
    });

    // Notification Queue (Low priority, high volume)
    this.notificationQueue = new Queue<EmailNotificationJob>('Notifications', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 10,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.setupProcessors();
    this.setupEventHandlers();
  }

  private setupProcessors() {
    // AI Processing Worker
    this.aiQueue.process('ai-processing', 2, async (job) => {
      const { noteId, content, settings, pdfBuffer, userId } = job.data;
      
      try {
        console.log(`🚀 Processing AI job ${job.id} for note ${noteId}`);
        
        // Update job progress
        await job.progress(10);
        
        // Update note status
        await storage.updateNoteStatus(noteId, "processing");
        await job.progress(20);

        // Create processing context
        const context = {
          contentType: pdfBuffer ? 'pdf' as const : 'text' as const,
          contentLength: content.length,
          priority: job.data.priority === 'critical' ? 'high' as const : 'medium' as const,
          userTier: 'free' as const, // TODO: Get from user context
          maxCost: 0.75, // Higher cost limit for queue processing
          timeoutMs: 90000, // 90 seconds for background processing
        };

        await job.progress(30);

        // Process with AI orchestrator
        const aiResponse = await aiOrchestrator.processWithMultipleModels(content, settings, context);
        await job.progress(80);

        // Update note with processed content
        await storage.updateNoteContent(noteId, aiResponse.data);
        await job.progress(90);

        // Record metrics
        metricsCollector.recordAIProcessing(
          aiResponse.processingTime, 
          aiResponse.model, 
          aiResponse.cached
        );

        await job.progress(100);
        
        console.log(`✅ Completed AI job ${job.id} for note ${noteId} using ${aiResponse.model}`);
        
        // Queue notification job
        if (userId) {
          await this.queueNotification(userId, 'processing_complete', noteId);
        }

        return {
          success: true,
          noteId,
          model: aiResponse.model,
          processingTime: aiResponse.processingTime,
          cached: aiResponse.cached,
        };

      } catch (error) {
        console.error(`❌ AI job ${job.id} failed:`, error);
        
        // Create fallback content
        const fallbackContent = {
          title: content.substring(0, 50) + "...",
          keyConcepts: [{
            title: "Processing Error",
            definition: "AI processing encountered an issue. Content has been saved."
          }],
          summaryPoints: [{
            heading: "Original Content",
            points: [content.length > 500 ? content.substring(0, 500) + "..." : content]
          }],
          processFlow: [],
          metadata: {
            source: "queue_fallback",
            generatedAt: new Date().toISOString(),
            style: settings.summaryStyle || "academic",
            aiModelsUsed: ["fallback"],
            errorType: error instanceof Error ? error.name : "UnknownError"
          }
        };

        await storage.updateNoteContent(noteId, fallbackContent);
        await storage.updateNoteStatus(noteId, "completed");

        // Queue failure notification
        if (userId) {
          await this.queueNotification(userId, 'processing_failed', noteId);
        }

        throw error; // Re-throw for Bull to handle retry logic
      }
    });

    // PDF Generation Worker
    this.pdfQueue.process('pdf-generation', 3, async (job) => {
      const { noteId, options, userId } = job.data;
      
      try {
        console.log(`📄 Processing PDF job ${job.id} for note ${noteId}`);
        
        // Implementation for PDF generation would go here
        // For now, just simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          success: true,
          noteId,
          pdfPath: `/api/notes/${noteId}/download`,
        };

      } catch (error) {
        console.error(`❌ PDF job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Notification Worker
    this.notificationQueue.process('notification', 10, async (job) => {
      const { userId, type, noteId } = job.data;
      
      try {
        console.log(`📧 Processing notification job ${job.id} for user ${userId}`);
        
        // Implementation for email notifications would go here
        // For now, just log the notification
        console.log(`Notification: ${type} for note ${noteId} to user ${userId}`);
        
        return {
          success: true,
          userId,
          type,
          noteId,
        };

      } catch (error) {
        console.error(`❌ Notification job ${job.id} failed:`, error);
        throw error;
      }
    });
  }

  private setupEventHandlers() {
    // AI Queue Events
    this.aiQueue.on('completed', (job, result) => {
      console.log(`✅ AI job ${job.id} completed successfully`);
      metricsCollector.recordRequest(true, result.processingTime || 0);
    });

    this.aiQueue.on('failed', (job, err) => {
      console.error(`❌ AI job ${job.id} failed:`, err.message);
      metricsCollector.recordRequest(false, 0);
    });

    this.aiQueue.on('stalled', (job) => {
      console.warn(`⚠️  AI job ${job.id} stalled`);
    });

    // PDF Queue Events
    this.pdfQueue.on('completed', (job, result) => {
      console.log(`✅ PDF job ${job.id} completed successfully`);
    });

    this.pdfQueue.on('failed', (job, err) => {
      console.error(`❌ PDF job ${job.id} failed:`, err.message);
    });

    // Global error handling
    this.aiQueue.on('error', (error) => {
      console.error('AI Queue error:', error);
    });

    this.pdfQueue.on('error', (error) => {
      console.error('PDF Queue error:', error);
    });

    this.notificationQueue.on('error', (error) => {
      console.error('Notification Queue error:', error);
    });
  }

  // Public methods for queuing jobs
  async queueAIProcessing(jobData: AIProcessingJob): Promise<Queue.Job<AIProcessingJob> | null> {
    if (!redisAvailable || !this.aiQueue) {
      // Process immediately if queue is not available
      console.log('🔄 Processing AI job immediately (no queue available)');
      this.processAIJobDirectly(jobData);
      return null;
    }

    const priority = this.getPriorityValue(jobData.priority);
    
    return this.aiQueue.add('ai-processing', jobData, {
      priority,
      delay: jobData.priority === 'low' ? 5000 : 0, // Delay low priority jobs by 5 seconds
    });
  }

  // Direct processing when queue is not available
  private async processAIJobDirectly(jobData: AIProcessingJob): Promise<void> {
    const { noteId, content, settings, pdfBuffer, userId } = jobData;
    
    try {
      console.log(`🚀 Processing AI job directly for note ${noteId}`);
      
      // Update note status
      await storage.updateNoteStatus(noteId, "processing");

      // Create processing context
      const context = {
        contentType: pdfBuffer ? 'pdf' as const : 'text' as const,
        contentLength: content.length,
        priority: jobData.priority === 'critical' ? 'high' as const : 'medium' as const,
        userTier: 'free' as const,
        maxCost: 0.75,
        timeoutMs: 60000, // 60 seconds
      };

      // Process with AI orchestrator
      const aiResponse = await aiOrchestrator.processWithMultipleModels(content, settings, context);

      // Update note with processed content
      await storage.updateNoteContent(noteId, aiResponse.data);

      // Record metrics
      metricsCollector.recordAIProcessing(
        aiResponse.processingTime, 
        aiResponse.model, 
        aiResponse.cached
      );

      console.log(`✅ Completed AI processing for note ${noteId} using ${aiResponse.model}`);

    } catch (error) {
      console.error(`❌ Direct AI processing failed for note ${noteId}:`, error);
      
      // Create fallback content
      const fallbackContent = {
        title: content.substring(0, 50) + "...",
        keyConcepts: [{
          title: "Processing Error",
          definition: "AI processing encountered an issue. Content has been saved."
        }],
        summaryPoints: [{
          heading: "Original Content",
          points: [content.length > 500 ? content.substring(0, 500) + "..." : content]
        }],
        processFlow: [],
        metadata: {
          source: "direct_fallback",
          generatedAt: new Date().toISOString(),
          style: settings.summaryStyle || "academic",
          aiModelsUsed: ["fallback"],
          errorType: error instanceof Error ? error.name : "UnknownError"
        }
      };

      await storage.updateNoteContent(noteId, fallbackContent);
      await storage.updateNoteStatus(noteId, "completed");
    }
  }

  async queuePDFGeneration(jobData: PDFGenerationJob): Promise<Queue.Job<PDFGenerationJob> | null> {
    if (!redisAvailable || !this.pdfQueue) {
      console.log('🔄 PDF generation queue not available');
      return null;
    }
    return this.pdfQueue.add('pdf-generation', jobData);
  }

  async queueNotification(userId: string, type: EmailNotificationJob['type'], noteId: number): Promise<Queue.Job<EmailNotificationJob> | null> {
    if (!redisAvailable || !this.notificationQueue) {
      console.log(`📧 Notification sent directly: ${type} for note ${noteId} to user ${userId}`);
      return null;
    }
    return this.notificationQueue.add('notification', {
      userId,
      type,
      noteId,
    }, {
      delay: 1000, // Delay notifications by 1 second
    });
  }

  // Queue management
  async getQueueStats() {
    if (!redisAvailable) {
      return {
        ai: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, status: 'direct_processing' },
        pdf: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, status: 'direct_processing' },
        notifications: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, status: 'direct_processing' },
      };
    }

    const [aiStats, pdfStats, notificationStats] = await Promise.all([
      this.getQueueStatus(this.aiQueue),
      this.getQueueStatus(this.pdfQueue),
      this.getQueueStatus(this.notificationQueue),
    ]);

    return {
      ai: { ...aiStats, status: 'queued' },
      pdf: { ...pdfStats, status: 'queued' },
      notifications: { ...notificationStats, status: 'queued' },
    };
  }

  private async getQueueStatus(queue: Queue.Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  private getPriorityValue(priority: AIProcessingJob['priority']): number {
    switch (priority) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'normal': return 3;
      case 'low': return 4;
      default: return 3;
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down job queues...');
    
    await Promise.all([
      this.aiQueue.close(),
      this.pdfQueue.close(),
      this.notificationQueue.close(),
    ]);
    
    console.log('✅ Job queues shut down successfully');
  }
}

// Singleton job processor
export const jobProcessor = new JobProcessor();

// Export job types for use in other modules
export type { AIProcessingJob, PDFGenerationJob, EmailNotificationJob };