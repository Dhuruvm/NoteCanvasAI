import { useState, useRef, useEffect } from "react";
import logoIcon from '@assets/Your_paragraph_text_20250902_153838_0000-removebg-preview_1756807918114.png';
import { Button } from "@/components/ui/button";
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Mic, 
  Send, 
  Menu,
  MoreHorizontal,
  Edit,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Share,
  Search,
  Library,
  Grid3X3,
  Archive,
  Trash2,
  Flag,
  PenTool,
  ChevronDown,
  Hash,
  ArrowUp,
  Upload,
  FileText,
  Brain,
  Wand2,
  Download,
  Eye,
  Settings,
  Palette,
  Type,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  File,
  PlusCircle,
  Sparkles,
  User,
  Trophy,
  Target,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Award,
  Star,
  Zap as ZapIcon
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageType?: "text" | "question" | "answer" | "quiz" | "explanation" | "research";
  metadata?: any;
  documentData?: any;
  isGeneratingDocument?: boolean;
  quizData?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    topic: string;
  };
}

interface ChatSession {
  id: number;
  noteId: number;
  title: string;
  difficulty: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
}

interface UserProgress {
  totalQuestions: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  points: number;
  level: number;
  badges: string[];
  penalties: number;
}

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface AISettings {
  summaryStyle: string;
  detailLevel: number;
  includeExamples: boolean;
  useMultipleModels: boolean;
  designStyle: string;
}

interface KiroChatInterfaceProps {
  noteId?: number;
  initialSession?: ChatSession;
}

export function KiroChatInterface({ noteId, initialSession }: KiroChatInterfaceProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('modern-card');
  const [aiSettings, setAiSettings] = useState<AISettings>({
    summaryStyle: 'academic',
    detailLevel: 3,
    includeExamples: true,
    useMultipleModels: true,
    designStyle: 'modern'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(initialSession || null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalQuestions: 0,
    correctAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    points: 0,
    level: 1,
    badges: [],
    penalties: 0
  });
  const [userId] = useState(() => `user_${Date.now()}`);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answerStartTime, setAnswerStartTime] = useState<number>(0);
  const [autopilot, setAutopilot] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    if (noteId && !currentSession) {
      initializeChatSession();
    } else if (currentSession) {
      loadChatMessages();
      loadUserProgress();
    }
  }, [noteId, currentSession]);

  // Load existing chat sessions
  useEffect(() => {
    if (noteId) {
      loadChatSessions();
    }
  }, [noteId]);

  // Initialize processing stages
  useEffect(() => {
    setProcessingStages([
      { id: 'upload', name: 'Content Upload', description: 'Processing uploaded content', status: 'pending' },
      { id: 'extract', name: 'Text Extraction', description: 'Extracting text from documents', status: 'pending' },
      { id: 'ai-analysis', name: 'AI Analysis', description: 'Analyzing content with multi-model AI', status: 'pending' },
      { id: 'structure', name: 'Content Structuring', description: 'Creating structured document format', status: 'pending' },
      { id: 'template', name: 'Template Application', description: 'Applying design template and styling', status: 'pending' },
      { id: 'generation', name: 'Document Generation', description: 'Generating final documents', status: 'pending' }
    ]);
  }, []);

  const initializeChatSession = async () => {
    if (!noteId) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          difficulty: 'intermediate',
          subject: 'General Study'
        })
      });
      
      if (response.ok) {
        const session = await response.json();
        setCurrentSession(session);
        toast({
          title: "Chat session started",
          description: "Ready to help you learn from your notes!"
        });
      }
    } catch (error) {
      console.error('Failed to create chat session:', error);
      // Initialize with welcome message if API fails
      setMessages([{
        id: '1',
        type: 'assistant',
        content: "👋 Welcome to NoteGPT! I'm your AI study companion. I can help you understand your content, answer questions, and quiz you to reinforce learning.\n\n**How to get started:**\n• Upload a document or paste text to begin\n• Ask questions about any topic\n• Request a quiz to test your knowledge\n• Get explanations for complex concepts\n\nWhat would you like to explore today?",
        timestamp: new Date(),
        messageType: 'text'
      }]);
    }
  };

  const loadChatSessions = async () => {
    if (!noteId) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}/chat`);
      if (response.ok) {
        const sessions = await response.json();
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const loadChatMessages = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(`/api/chat/${currentSession.id}/messages`);
      if (response.ok) {
        const chatMessages = await response.json();
        const formattedMessages = chatMessages.map((msg: any) => ({
          id: msg.id.toString(),
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          messageType: msg.messageType,
          metadata: msg.metadata
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadUserProgress = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(`/api/chat/${currentSession.id}/progress/${userId}`);
      if (response.ok) {
        const progress = await response.json();
        setUserProgress(progress);
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  // File upload configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
      handleFileUpload(acceptedFiles);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: true
  });

  const handleFileUpload = async (files: File[]) => {
    const fileNames = files.map(f => f.name).join(', ');
    toast({
      title: "Files uploaded",
      description: `${files.length} files ready for processing: ${fileNames}`,
    });
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `📁 Uploaded ${files.length} file(s): ${fileNames}\n\nReady to process with AI!`,
      timestamp: new Date(),
      messageType: 'text'
    };
    setMessages(prev => [...prev, userMessage]);
    
    // If we have a chat session, we could process the files for that context
    if (currentSession) {
      // TODO: Implement file processing for chat context
    }
  };

  const processContent = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) {
      toast({
        title: "No content to process",
        description: "Please enter text or upload files to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setIsTyping(true);
    
    const processingMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: "🔄 Starting AI processing pipeline...\n\nI'll transform your content through multiple AI models to create comprehensive, structured notes.",
      timestamp: new Date(),
      isGeneratingDocument: true
    };
    setMessages(prev => [...prev, processingMessage]);

    try {
      // Stage updates with realistic timing
      for (let i = 0; i < processingStages.length; i++) {
        setCurrentStage(i);
        updateStageStatus(processingStages[i].id, 'processing');
        await delay(800 + Math.random() * 400); // Realistic processing time
        updateStageStatus(processingStages[i].id, 'completed');
      }

      // Call NoteGPT processing API
      const response = await fetch('/api/notegpt/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputValue,
          settings: aiSettings
        })
      });

      if (!response.ok) throw new Error('AI processing failed');
      const result = await response.json();

      // Generate document preview
      const previewResponse = await fetch('/api/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: result.document,
          options: { format: 'html', includeAnnotations: true, includeTOC: true }
        })
      });

      let documentPreview = '';
      if (previewResponse.ok) {
        documentPreview = await previewResponse.text();
      }

      const completionMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `✅ **Document Generated Successfully!**\n\n📄 **Title:** ${result.document.meta.title}\n🎨 **Theme:** ${selectedTheme}\n📊 **Blocks:** ${result.document.blocks.length}\n⚡ **AI Model:** ${result.metadata.aiModel}\n\nYour structured notes are ready! You can:\n• View the document preview below\n• Download as PDF\n• Chat with me about the content\n• Regenerate with different settings`,
        timestamp: new Date(),
        documentData: {
          document: result.document,
          preview: documentPreview,
          metadata: result.metadata
        }
      };

      setMessages(prev => [...prev, completionMessage]);
      setInputValue("");

    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `❌ **Processing Failed**\n\nSorry, there was an error processing your content. This might be because:\n• API keys are not configured\n• The content is too large\n• Network connectivity issues\n\nIn development mode, some AI features require API keys to be configured. You can still use the template system with sample content!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
      setUploadedFiles([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;
    if (!currentSession) {
      toast({
        title: "No active session",
        description: "Please create a chat session first by uploading content.",
        variant: "destructive"
      });
      return;
    }

    if (uploadedFiles.length > 0 || inputValue.length > 50) {
      // Process with AI if files or substantial text
      await processContent();
    } else {
      // Send regular chat message
      await sendChatMessage(inputValue);
    }
  };

  const downloadPDF = async (documentData: any) => {
    try {
      const response = await fetch('/api/templates/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentData.document,
          options: { format: 'pdf', includeAnnotations: true, includeTOC: true, pageNumbers: true }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentData.document.meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "PDF Downloaded",
          description: "Your document has been saved successfully.",
        });
      } else {
        toast({
          title: "Download failed",
          description: "PDF generation service is currently unavailable. Try exporting as HTML instead.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Download error",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateStageStatus = (stageId: string, status: ProcessingStage['status']) => {
    setProcessingStages(prev => 
      prev.map(stage => 
        stage.id === stageId ? { ...stage, status } : stage
      )
    );
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendChatMessage = async (message: string) => {
    if (!currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      messageType: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`/api/chat/${currentSession.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMessage: Message = {
          id: result.assistantMessage.id.toString(),
          type: 'assistant',
          content: result.assistantMessage.content,
          timestamp: new Date(result.assistantMessage.timestamp),
          messageType: result.assistantMessage.messageType || 'text',
          metadata: result.assistantMessage.metadata
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Update user progress if provided
        if (result.context) {
          setUserProgress(prev => ({
            ...prev,
            currentStreak: result.context.currentStreak,
            points: result.context.points,
            level: result.context.level
          }));
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble processing your message right now. This might be because API keys aren't configured or there's a connectivity issue. Please try again, or upload content to start a new session.",
        timestamp: new Date(),
        messageType: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateQuiz = async () => {
    if (!currentSession) {
      toast({
        title: "No active session",
        description: "Please start a chat session first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsTyping(true);
    try {
      const response = await fetch(`/api/chat/${currentSession.id}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        const quiz = await response.json();
        const quizMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `🧠 **Quiz Time!**\n\n${quiz.question}`,
          timestamp: new Date(),
          messageType: 'quiz',
          quizData: quiz
        };
        
        setMessages(prev => [...prev, quizMessage]);
        setIsQuizMode(true);
        setAnswerStartTime(Date.now());
        
        toast({
          title: "Quiz generated!",
          description: "Test your knowledge with this question."
        });
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: "Quiz unavailable",
        description: "Unable to generate quiz. API configuration may be required.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const submitQuizAnswer = async (selectedAnswer: string, correctAnswer: string, difficulty: string) => {
    if (!currentSession) return;
    
    const timeTaken = Math.floor((Date.now() - answerStartTime) / 1000);
    
    try {
      const response = await fetch(`/api/chat/${currentSession.id}/quiz/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: selectedAnswer,
          correctAnswer,
          difficulty,
          timeTaken,
          userId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Show result message
        const resultMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `${result.isCorrect ? '✅' : '❌'} **${result.isCorrect ? 'Correct!' : 'Incorrect'}**\n\n${result.encouragement}\n\n**Points earned:** ${result.rewards.pointsEarned}\n**Current streak:** ${result.progress.currentStreak}\n**Level:** ${result.progress.level}`,
          timestamp: new Date(),
          messageType: 'answer'
        };
        
        setMessages(prev => [...prev, resultMessage]);
        setUserProgress(result.progress);
        setIsQuizMode(false);
        setSelectedAnswer("");
        
        // Show badges if earned
        if (result.rewards.newBadges.length > 0) {
          toast({
            title: "New badges earned!",
            description: result.rewards.newBadges.join(', ')
          });
        }
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast({
        title: "Submission failed",
        description: "Unable to submit quiz answer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  return (
    <>
      <style>{`
        .chat-interface {
          height: 100vh;
          background: #212121;
          color: #ffffff;
          display: flex;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        /* Sidebar */
        .sidebar {
          width: 280px;
          background: #171717;
          border-right: 1px solid #2a2a2a;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
        }

        .sidebar.hidden {
          transform: translateX(-100%);
          position: absolute;
          z-index: 20;
        }

        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid #2a2a2a;
        }

        .search-bar {
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: #ffffff;
          width: 100%;
          font-size: 0.9rem;
        }

        .search-bar::placeholder {
          color: #888888;
        }

        .sidebar-nav {
          padding: 1rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 0.5rem;
        }

        .nav-item:hover {
          background: #2a2a2a;
          color: #ffffff;
        }

        .nav-item.active {
          background: #a855f7;
          color: #ffffff;
        }

        .sidebar-section {
          margin-top: 1.5rem;
        }

        .section-title {
          color: #888888;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.75rem;
        }

        .chat-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 0.25rem;
        }

        .chat-item:hover {
          background: #2a2a2a;
        }

        .chat-item.active {
          background: #2a2a2a;
          color: #ffffff;
        }

        .chat-item.active::after {
          content: '';
          width: 4px;
          height: 4px;
          background: #a855f7;
          border-radius: 50%;
        }

        .user-profile {
          padding: 1rem;
          border-top: 1px solid #2a2a2a;
          margin-top: auto;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #ffffff;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: #a855f7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Main Chat Area */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        /* Header */
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #2a2a2a;
          background: #212121;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .chat-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          color: #888888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-btn:hover {
          background: #2a2a2a;
          color: #ffffff;
        }

        /* Messages Area */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem 0;
        }

        .message {
          margin-bottom: 2rem;
          padding: 0 1.5rem;
        }

        .message.user {
          display: flex;
          justify-content: flex-end;
        }

        .message.assistant {
          display: flex;
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          position: relative;
        }

        .message.user .message-content {
          background: #2a2a2a;
          border-radius: 1.25rem 1.25rem 0.25rem 1.25rem;
          padding: 1rem 1.25rem;
          color: #ffffff;
        }

        .message.assistant .message-content {
          background: transparent;
          padding: 0;
        }

        .assistant-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .assistant-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .assistant-name {
          font-weight: 600;
          color: #ffffff;
        }

        .assistant-message {
          color: #e0e0e0;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .message-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .message:hover .message-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 0.5rem;
          background: #2a2a2a;
          border: none;
          border-radius: 0.5rem;
          color: #888888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #3a3a3a;
          color: #ffffff;
        }

        /* Typing Indicator */
        .typing-indicator {
          padding: 0 1.5rem;
          margin-bottom: 1rem;
        }

        .typing-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .typing-dots {
          display: flex;
          gap: 0.25rem;
          padding: 1rem 1.25rem;
          background: #2a2a2a;
          border-radius: 1rem;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: #888888;
          border-radius: 50%;
          animation: typing 1.5s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Input Area - ChatGPT Style */
        .input-area {
          padding: 1.5rem;
          background: #212121;
        }

        .input-container {
          max-width: 768px;
          margin: 0 auto;
          position: relative;
        }

        .input-wrapper {
          background: #2a2a2a;
          border: 2px solid #a855f7;
          border-radius: 1.5rem;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: end;
          gap: 1rem;
          transition: all 0.2s ease;
          box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.1);
        }

        .input-wrapper:focus-within {
          border-color: #a855f7;
          box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
        }

        .input-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #888888;
          font-size: 0.9rem;
        }

        .message-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 1rem;
          line-height: 1.5;
          resize: none;
          min-height: 24px;
          max-height: 120px;
          font-family: inherit;
        }

        .message-input::placeholder {
          color: #888888;
        }

        .input-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .model-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #cccccc;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .model-selector:hover {
          background: #3a3a3a;
        }

        .autopilot-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #cccccc;
          font-size: 0.9rem;
        }

        .toggle-switch {
          width: 36px;
          height: 20px;
          background: #a855f7;
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .toggle-switch.inactive {
          background: #404040;
        }

        .toggle-thumb {
          width: 16px;
          height: 16px;
          background: #ffffff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          right: 2px;
          transition: transform 0.2s ease;
        }

        .toggle-switch.inactive .toggle-thumb {
          transform: translateX(-16px);
        }

        .input-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .input-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          color: #888888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .input-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .send-btn {
          background: #ffffff;
          color: #000000;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .send-btn:hover {
          background: #e0e0e0;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: #404040;
          color: #888888;
          cursor: not-allowed;
          transform: none;
        }

        /* Context Menu */
        .context-menu {
          position: fixed;
          top: 50%;
          right: 2rem;
          transform: translateY(-50%);
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 0.75rem;
          padding: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          z-index: 30;
          min-width: 180px;
        }

        .menu-section {
          margin-bottom: 0.5rem;
        }

        .menu-section:last-child {
          margin-bottom: 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: #cccccc;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .menu-item:hover {
          background: #3a3a3a;
          color: #ffffff;
        }

        .menu-item.danger {
          color: #ef4444;
        }

        .menu-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .menu-divider {
          height: 1px;
          background: #3a3a3a;
          margin: 0.5rem 0;
        }

        /* NoteGPT Enhanced Styles */
        .drag-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(168, 85, 247, 0.1);
          border: 2px dashed #a855f7;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .drag-content {
          text-align: center;
          padding: 2rem;
        }

        .processing-stages {
          background: #2a2a2a;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-top: 1rem;
          border: 1px solid #3a3a3a;
        }

        .stages-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .stage-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
        }

        .stage-icon {
          flex-shrink: 0;
        }

        .stage-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .stage-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #ffffff;
        }

        .stage-desc {
          font-size: 0.75rem;
          color: #888888;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #404040;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a855f7, #8b5cf6);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .document-preview {
          background: #2a2a2a;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-top: 1rem;
          border: 1px solid #3a3a3a;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .preview-actions {
          display: flex;
          gap: 0.5rem;
        }

        .preview-btn {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #a855f7;
          color: #ffffff;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preview-btn:hover {
          background: #9333ea;
          transform: translateY(-1px);
        }

        .document-iframe-container {
          width: 100%;
          height: 400px;
          background: #ffffff;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .document-iframe {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 0.5rem;
        }

        .document-meta {
          display: flex;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .meta-label {
          color: #888888;
          font-weight: 500;
        }

        .meta-value {
          color: #ffffff;
        }

        .upload-area {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-right: 0.5rem;
        }

        .upload-btn {
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: 0.5rem;
          color: #888888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #a855f7;
        }

        .upload-btn.active {
          color: #a855f7;
          background: rgba(168, 85, 247, 0.1);
        }

        .file-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(168, 85, 247, 0.2);
          border-radius: 0.75rem;
          font-size: 0.75rem;
          color: #a855f7;
        }

        .settings-panel {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          z-index: 20;
          min-width: 250px;
        }

        .settings-header {
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .setting-item {
          margin-bottom: 0.75rem;
        }

        .setting-label {
          display: block;
          font-size: 0.75rem;
          color: #888888;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }

        .setting-select {
          width: 100%;
          background: #3a3a3a;
          border: 1px solid #444444;
          border-radius: 0.5rem;
          padding: 0.5rem;
          color: #ffffff;
          font-size: 0.875rem;
        }

        .setting-slider {
          width: 100%;
          margin: 0.5rem 0;
        }

        .setting-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #cccccc;
        }

        /* Progress Stats */
        .progress-stats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-size: 0.875rem;
          color: #cccccc;
        }

        .badges-section {
          margin-top: 1rem;
        }

        .badges-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }

        .badge-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(168, 85, 247, 0.1);
          border-radius: 0.5rem;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        /* Quiz Messages */
        .quiz-container {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1));
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .quiz-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #a855f7;
          font-weight: 600;
        }

        .quiz-question {
          font-size: 1.1rem;
          color: #ffffff;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .quiz-option {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #ffffff;
        }

        .quiz-option:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(168, 85, 247, 0.5);
        }

        .quiz-option.selected {
          background: rgba(168, 85, 247, 0.2);
          border-color: #a855f7;
        }

        .quiz-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .quiz-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quiz-btn-submit {
          background: #a855f7;
          color: #ffffff;
        }

        .quiz-btn-submit:hover {
          background: #9333ea;
          transform: translateY(-1px);
        }

        .quiz-btn-submit:disabled {
          background: #666666;
          cursor: not-allowed;
          transform: none;
        }

        /* Message Type Indicators */
        .message-type-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(168, 85, 247, 0.1);
          border-radius: 0.5rem;
          font-size: 0.75rem;
          color: #a855f7;
          margin-bottom: 0.5rem;
        }

        .message-type-quiz {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .message-type-explanation {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .message-type-research {
          background: rgba(245, 101, 101, 0.1);
          color: #f59e0b;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 20;
            transform: translateX(-100%);
          }

          .sidebar.visible {
            transform: translateX(0);
          }

          .chat-main {
            width: 100%;
          }

          .chat-header {
            padding: 1rem;
          }

          .message {
            padding: 0 1rem;
          }

          .message-content {
            max-width: 85%;
          }

          .input-area {
            padding: 1rem;
          }

          .input-wrapper {
            padding: 0.75rem 1rem;
          }

          .input-left,
          .input-right {
            display: none;
          }

          .context-menu {
            right: 1rem;
          }
        }

        @media (max-width: 480px) {
          .message-content {
            max-width: 90%;
          }

          .input-wrapper {
            padding: 0.5rem 0.75rem;
          }

          .context-menu {
            right: 0.5rem;
            left: 0.5rem;
            right: auto;
            width: calc(100% - 1rem);
          }
        }
      `}</style>

      <div className="chat-interface">
        {/* Sidebar */}
        <aside className={`sidebar ${showSidebar ? 'visible' : 'hidden'}`}>
          <div className="sidebar-header">
            <input 
              type="text" 
              placeholder="Search"
              className="search-bar"
              data-testid="input-search"
            />
          </div>

          <nav className="sidebar-nav">
            <div className="nav-item active" data-testid="nav-new-chat" onClick={() => noteId && initializeChatSession()}>
              <Edit className="h-5 w-5" />
              <span>New chat</span>
            </div>
            
            <div className="nav-item" data-testid="nav-quiz" onClick={generateQuiz}>
              <Brain className="h-5 w-5" />
              <span>Generate Quiz</span>
            </div>
            
            <div className="nav-item" data-testid="nav-progress">
              <Trophy className="h-5 w-5" />
              <span>Progress</span>
            </div>

            {chatSessions.length > 0 && (
              <div className="sidebar-section">
                <div className="section-title">Chat Sessions</div>
                {chatSessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`chat-item ${currentSession?.id === session.id ? 'active' : ''}`}
                    onClick={() => setCurrentSession(session)}
                    data-testid={`chat-${session.id}`}
                  >
                    <span>{session.title}</span>
                    <span className="text-xs text-gray-400">{session.difficulty}</span>
                  </div>
                ))}
              </div>
            )}

            {userProgress && (
              <div className="sidebar-section">
                <div className="section-title">Your Progress</div>
                <div className="progress-stats">
                  <div className="stat-item">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span>Level {userProgress.level}</span>
                  </div>
                  <div className="stat-item">
                    <Star className="h-4 w-4 text-blue-400" />
                    <span>{userProgress.points} points</span>
                  </div>
                  <div className="stat-item">
                    <Target className="h-4 w-4 text-green-400" />
                    <span>{userProgress.currentStreak} streak</span>
                  </div>
                  <div className="stat-item">
                    <BookOpen className="h-4 w-4 text-purple-400" />
                    <span>{userProgress.correctAnswers}/{userProgress.totalQuestions} correct</span>
                  </div>
                </div>
                {userProgress.badges.length > 0 && (
                  <div className="badges-section">
                    <div className="section-title">Badges</div>
                    <div className="badges-grid">
                      {userProgress.badges.map((badge, index) => (
                        <div key={index} className="badge-item">
                          <Award className="h-4 w-4 text-yellow-400" />
                          <span className="text-xs">{badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="user-profile">
            <div className="user-info">
              <div className="user-avatar">
                <User className="h-4 w-4" />
              </div>
              <span>Study Session</span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </div>
          </div>
        </aside>

        {/* Main Chat */}
        <main className="chat-main">
          {/* Header */}
          <header className="chat-header">
            <div className="header-left">
              <Button 
                variant="ghost" 
                size="sm" 
                className="header-btn"
                onClick={() => setShowSidebar(!showSidebar)}
                data-testid="button-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="chat-title">NoteGPT</h1>
            </div>
            
            <div className="header-actions">
              <button className="header-btn" data-testid="button-edit">
                <Edit className="h-5 w-5" />
              </button>
              <button 
                className="header-btn" 
                onClick={() => setShowContextMenu(!showContextMenu)}
                data-testid="button-more"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="messages-container" {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="drag-overlay">
                <div className="drag-content">
                  <Upload className="h-12 w-12 mb-4 mx-auto text-purple-400" />
                  <p className="text-lg font-medium text-white">Drop files here to process with AI</p>
                  <p className="text-sm text-gray-400">Supports PDF, DOC, TXT, MD files (max 10MB)</p>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.type === 'assistant' && (
                    <div className="assistant-header">
                      <div className="assistant-avatar">
                        <img 
                          src={logoIcon} 
                          alt="NoteGPT" 
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <span className="assistant-name">NoteGPT</span>
                    </div>
                  )}
                  
                  {/* Message Type Indicator */}
                  {message.type === 'assistant' && message.messageType && message.messageType !== 'text' && (
                    <div className={`message-type-indicator ${message.messageType === 'quiz' ? 'message-type-quiz' : message.messageType === 'explanation' ? 'message-type-explanation' : message.messageType === 'research' ? 'message-type-research' : ''}`}>
                      {message.messageType === 'quiz' && <HelpCircle className="h-3 w-3" />}
                      {message.messageType === 'explanation' && <Lightbulb className="h-3 w-3" />}
                      {message.messageType === 'research' && <Search className="h-3 w-3" />}
                      {message.messageType === 'question' && <MessageSquare className="h-3 w-3" />}
                      <span className="capitalize">{message.messageType}</span>
                    </div>
                  )}

                  <div className={message.type === 'assistant' ? 'assistant-message' : ''}>
                    {message.content}
                  </div>

                  {/* Quiz Interface */}
                  {message.messageType === 'quiz' && message.quizData && (
                    <div className="quiz-container">
                      <div className="quiz-header">
                        <Brain className="h-5 w-5" />
                        <span>Interactive Quiz</span>
                      </div>
                      
                      <div className="quiz-question">
                        {message.quizData.question}
                      </div>
                      
                      <div className="quiz-options">
                        {message.quizData.options.map((option, index) => (
                          <div
                            key={index}
                            className={`quiz-option ${selectedAnswer === option ? 'selected' : ''}`}
                            onClick={() => setSelectedAnswer(option)}
                          >
                            <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                          </div>
                        ))}
                      </div>
                      
                      <div className="quiz-actions">
                        <button
                          className="quiz-btn quiz-btn-submit"
                          disabled={!selectedAnswer}
                          onClick={() => submitQuizAnswer(
                            selectedAnswer,
                            message.quizData!.correctAnswer,
                            message.quizData!.difficulty
                          )}
                        >
                          <ZapIcon className="h-4 w-4 mr-2" />
                          Submit Answer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Processing Stages Indicator */}
                  {message.isGeneratingDocument && isProcessing && (
                    <div className="processing-stages">
                      <div className="stages-header">
                        <h4 className="text-sm font-medium text-white mb-3">AI Processing Pipeline</h4>
                      </div>
                      <div className="stages-list">
                        {processingStages.map((stage, index) => (
                          <div key={stage.id} className="stage-item">
                            <div className="stage-icon">
                              {stage.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-400" />}
                              {stage.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
                              {stage.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                              {stage.status === 'pending' && <Clock className="h-4 w-4 text-gray-500" />}
                            </div>
                            <div className="stage-info">
                              <span className="stage-name">{stage.name}</span>
                              <span className="stage-desc">{stage.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(currentStage / processingStages.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Document Preview */}
                  {message.documentData && (
                    <div className="document-preview">
                      <div className="preview-header">
                        <h4 className="text-sm font-medium text-white mb-2">📄 Generated Document</h4>
                        <div className="preview-actions">
                          <button 
                            className="preview-btn"
                            onClick={() => downloadPDF(message.documentData)}
                            data-testid="button-download-pdf"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </button>
                          <button className="preview-btn" data-testid="button-view-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Full
                          </button>
                        </div>
                      </div>
                      
                      {message.documentData.preview && (
                        <div className="document-iframe-container">
                          <iframe
                            srcDoc={message.documentData.preview}
                            className="document-iframe"
                            title="Document Preview"
                          />
                        </div>
                      )}
                      
                      <div className="document-meta">
                        <div className="meta-item">
                          <span className="meta-label">Theme:</span>
                          <span className="meta-value">{selectedTheme}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Blocks:</span>
                          <span className="meta-value">{message.documentData.document.blocks.length}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">AI Model:</span>
                          <span className="meta-value">{message.documentData.metadata.aiModel}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.type === 'assistant' && (
                    <div className="message-actions">
                      <button className="action-btn" data-testid="button-copy">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="action-btn" data-testid="button-thumbs-up">
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button className="action-btn" data-testid="button-thumbs-down">
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                      <button className="action-btn" data-testid="button-regenerate">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button className="action-btn" data-testid="button-share">
                        <Share className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="typing-indicator">
                <div className="typing-content">
                  <div className="assistant-avatar">
                    <img 
                      src={logoIcon} 
                      alt="NoteGPT" 
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Exact ChatGPT Style */}
          <div className="input-area">
            <div className="input-container">
              <div className="input-wrapper">
                <div className="input-left">
                  <Hash className="h-4 w-4" />
                  <MessageSquare className="h-4 w-4" />
                </div>

                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    adjustTextareaHeight();
                  }}
                  placeholder="Ask a question or describe a task..."
                  className="message-input"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="input-message"
                />

                <div className="input-right">
                  <div className="model-selector" data-testid="selector-model">
                    <span>Claude Sonnet 4.0</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>

                  <div className="autopilot-toggle">
                    <span>Autopilot</span>
                    <div 
                      className={`toggle-switch ${autopilot ? '' : 'inactive'}`}
                      onClick={() => setAutopilot(!autopilot)}
                      data-testid="toggle-autopilot"
                    >
                      <div className="toggle-thumb"></div>
                    </div>
                  </div>
                </div>

                <div className="input-controls">
                  <button className="input-btn" data-testid="button-mic">
                    <Mic className="h-5 w-5" />
                  </button>
                  
                  <button 
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    data-testid="button-send"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Context Menu */}
        {showContextMenu && (
          <div className="context-menu">
            <div className="menu-section">
              <div className="menu-item" data-testid="menu-share">
                <Share className="h-4 w-4" />
                <span>Share</span>
              </div>
              <div className="menu-item" data-testid="menu-rename">
                <PenTool className="h-4 w-4" />
                <span>Rename</span>
              </div>
              <div className="menu-item" data-testid="menu-archive">
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </div>
            </div>
            
            <div className="menu-divider"></div>
            
            <div className="menu-section">
              <div className="menu-item danger" data-testid="menu-delete">
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </div>
              <div className="menu-item" data-testid="menu-report">
                <Flag className="h-4 w-4" />
                <span>Report</span>
              </div>
            </div>
          </div>
        )}

        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>
    </>
  );
}