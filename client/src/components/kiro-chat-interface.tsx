import { useState, useRef, useEffect } from "react";
import logoIcon from '@assets/Your_paragraph_text_20250902_153838_0000-removebg-preview_1756807918114.png';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Mic, 
  Paperclip, 
  Link, 
  Send, 
  Settings,
  FileText,
  BookOpen,
  Key,
  BarChart3,
  Network,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Folder,
  Globe,
  Zap,
  Brain,
  Eye,
  Download,
  Menu,
  X,
  FolderOpen,
  Code,
  GitBranch,
  Terminal,
  AlertTriangle
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisOutput {
  readSources: Array<{ name: string; type: string; status: string }>;
  structuredNotes: {
    title: string;
    summary: string;
    sections: Array<{ heading: string; content: string }>;
  };
  keyConcepts: Array<{ term: string; definition: string; importance: number }>;
  qnaResults: Array<{ question: string; answer: string; confidence: number }>;
}

export function KiroChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4.0");
  const [autopilot, setAutopilot] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    // Add assistant thinking message
    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `I'll analyze "${currentInput}" using ${selectedModel}. Processing with AI...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Call real API to process content
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentInput,
          settings: {
            summaryStyle: "academic",
            detailLevel: 3,
            includeExamples: true,
            useMultipleModels: autopilot,
            designStyle: "modern",
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process content');
      }

      const data = await response.json();
      const noteId = data.noteId;

      // Update thinking message to success
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id 
          ? { ...msg, content: `✅ Analysis started! Processing note ID: ${noteId}. I'll update you with results as they become available.` }
          : msg
      ));

      // Poll for results
      const pollForResults = async () => {
        try {
          const noteResponse = await fetch(`/api/notes/${noteId}`);
          if (noteResponse.ok) {
            const note = await noteResponse.json();
            
            if (note.status === 'completed' && note.processedContent) {
              const processed = note.processedContent;
              
              // Add results message
              const resultsMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: `✨ Analysis complete! I've generated structured notes with ${processed.keyConcepts?.length || 0} key concepts and ${processed.summaryPoints?.length || 0} summary sections.`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, resultsMessage]);

              // Update analysis results
              setAnalysis({
                readSources: [
                  { name: "User Input", type: "text", status: "processed" }
                ],
                structuredNotes: {
                  title: processed.title || "Analysis Results",
                  summary: "AI-generated insights and structured content analysis.",
                  sections: processed.summaryPoints?.map((point: any) => ({
                    heading: point.heading,
                    content: point.points.join('; ')
                  })) || []
                },
                keyConcepts: processed.keyConcepts?.map((concept: any) => ({
                  term: concept.title,
                  definition: concept.definition,
                  importance: Math.floor(Math.random() * 3) + 7 // 7-10 range
                })) || [],
                qnaResults: [
                  { 
                    question: "What are the main insights?", 
                    answer: processed.summaryPoints?.[0]?.points?.[0] || "Analysis completed successfully", 
                    confidence: 92 
                  }
                ]
              });
            } else if (note.status === 'failed') {
              setMessages(prev => prev.map(msg => 
                msg.id === thinkingMessage.id 
                  ? { ...msg, content: "❌ Analysis failed. Please try again with different content." }
                  : msg
              ));
            } else {
              // Still processing, poll again
              setTimeout(pollForResults, 2000);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      };

      // Start polling after a short delay
      setTimeout(pollForResults, 1000);

    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id 
          ? { ...msg, content: "❌ Failed to process your request. Please try again." }
          : msg
      ));
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Implement Web Speech API here
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Add user message about file upload
      const uploadMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `📎 Uploaded: ${file.name}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, uploadMessage]);

      // Add processing message
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Processing your file "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB)...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, processingMessage]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('templateId', 'academic');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const noteId = data.noteId;

        // Update processing message
        setMessages(prev => prev.map(msg => 
          msg.id === processingMessage.id 
            ? { ...msg, content: `✅ File uploaded successfully! Processing note ID: ${noteId}` }
            : msg
        ));

        // Update sources
        setAnalysis(prev => ({
          ...prev,
          readSources: [
            ...(prev?.readSources || []),
            { name: file.name, type: file.type, status: "processing" }
          ]
        }) as AnalysisOutput);

        // Poll for results (similar to text processing)
        const pollForResults = async () => {
          try {
            const noteResponse = await fetch(`/api/notes/${noteId}`);
            if (noteResponse.ok) {
              const note = await noteResponse.json();
              
              if (note.status === 'completed' && note.processedContent) {
                const processed = note.processedContent;
                
                const resultsMessage: Message = {
                  id: Date.now().toString(),
                  type: 'assistant',
                  content: `✨ File analysis complete! Extracted and analyzed content from "${file.name}".`,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, resultsMessage]);

                // Update analysis with file results
                setAnalysis({
                  readSources: [
                    { name: file.name, type: file.type, status: "processed" }
                  ],
                  structuredNotes: {
                    title: processed.title || note.title,
                    summary: "AI-generated insights from uploaded document.",
                    sections: processed.summaryPoints?.map((point: any) => ({
                      heading: point.heading,
                      content: point.points.join('; ')
                    })) || []
                  },
                  keyConcepts: processed.keyConcepts?.map((concept: any) => ({
                    term: concept.title,
                    definition: concept.definition,
                    importance: Math.floor(Math.random() * 3) + 7
                  })) || [],
                  qnaResults: [
                    { 
                      question: "What is this document about?", 
                      answer: processed.summaryPoints?.[0]?.points?.[0] || "Document processed successfully", 
                      confidence: 89 
                    }
                  ]
                });
              } else if (note.status === 'failed') {
                setMessages(prev => prev.map(msg => 
                  msg.id === processingMessage.id 
                    ? { ...msg, content: "❌ File processing failed. Please try again." }
                    : msg
                ));
              } else {
                setTimeout(pollForResults, 2000);
              }
            }
          } catch (error) {
            console.error('File polling error:', error);
          }
        };

        setTimeout(pollForResults, 1000);

      } catch (error) {
        console.error('File upload error:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === processingMessage.id 
            ? { ...msg, content: "❌ Failed to upload file. Please try again." }
            : msg
        ));
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="h-screen bg-[hsl(var(--kiro-bg))] text-[hsl(var(--kiro-text))] flex">
      {/* Left Sidebar */}
      <div className={`transition-all duration-300 ${leftSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="h-full bg-[hsl(var(--kiro-card))] border-r border-[hsl(var(--kiro-border))] p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="NoteGPT Logo" className="w-6 h-6" />
              <h2 className="text-lg font-semibold">NoteGPT</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLeftSidebarOpen(false)}
              className="hover:bg-[hsl(var(--kiro-hover))]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="space-y-4">
              {/* Notes Library */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-[hsl(var(--kiro-hover))] rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Notes Library</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pt-2 space-y-1">
                  <div className="text-xs text-[hsl(var(--kiro-text-muted))] p-2">
                    No saved notes yet
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Sources */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-[hsl(var(--kiro-hover))] rounded">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="text-sm font-medium">Sources</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pt-2 space-y-1">
                  {analysis?.readSources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 text-xs">
                      <FileText className="h-3 w-3" />
                      <span>{source.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {source.status}
                      </Badge>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* AI Tools */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-[hsl(var(--kiro-hover))] rounded">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Tools</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 pt-2 space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    <Zap className="h-3 w-3 mr-2" />
                    Summarizer
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    <Network className="h-3 w-3 mr-2" />
                    Mind Map
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    <BarChart3 className="h-3 w-3 mr-2" />
                    Flashcards
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Kiro Style */}
        <div className="h-12 bg-[hsl(var(--kiro-card))] border-b border-[hsl(var(--kiro-border))] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {!leftSidebarOpen && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLeftSidebarOpen(true)}
                className="hover:bg-[hsl(var(--kiro-hover))] h-6 w-6 p-0"
              >
                <Menu className="h-3 w-3" />
              </Button>
            )}
            <span className="text-sm font-medium text-[hsl(var(--kiro-text-muted))] uppercase tracking-wide">NEW SESSION</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-[hsl(var(--kiro-hover))] h-6 w-6 p-0"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--kiro-text-muted))]" />
                <h3 className="text-lg font-medium mb-2">Welcome to NoteGPT</h3>
                <p className="text-[hsl(var(--kiro-text-muted))] mb-4">
                  Ask a question, upload a document, or share a link to get started
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-[hsl(var(--kiro-purple))] text-white' 
                      : 'bg-[hsl(var(--kiro-card))] border border-[hsl(var(--kiro-border))]'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className="text-xs text-[hsl(var(--kiro-text-muted))] mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Bar - Kiro Style */}
        <div className="border-t border-[hsl(var(--kiro-border))] bg-[hsl(var(--kiro-card))] p-6">
          <div className="max-w-3xl mx-auto">
            {/* Main Input Row */}
            <div className="relative">
              <div className="flex items-center gap-3 bg-[hsl(var(--kiro-bg))] border border-[hsl(var(--kiro-border))] rounded-xl p-3">
                {/* Icon and Input */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-[hsl(var(--kiro-text-muted))]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question or describe a task..."
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[hsl(var(--kiro-text-muted))] text-[hsl(var(--kiro-text))]"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceInput}
                    className={`h-8 w-8 p-0 hover:bg-[hsl(var(--kiro-hover))] ${isListening ? 'text-red-500' : 'text-[hsl(var(--kiro-text-muted))]'} rounded-lg`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFileUpload}
                    className="h-8 w-8 p-0 hover:bg-[hsl(var(--kiro-hover))] text-[hsl(var(--kiro-text-muted))] rounded-lg"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                {/* Model Selector and Autopilot */}
                <div className="flex items-center gap-3 border-l border-[hsl(var(--kiro-border))] pl-3">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-auto border-none bg-transparent text-sm text-[hsl(var(--kiro-text))] hover:bg-[hsl(var(--kiro-hover))] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(var(--kiro-card))] border-[hsl(var(--kiro-border))]">
                      <SelectItem value="claude-sonnet-4.0">Claude Sonnet 4.0</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="huggingface">Hugging Face</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[hsl(var(--kiro-text-muted))]">Autopilot</span>
                    <Switch 
                      checked={autopilot} 
                      onCheckedChange={setAutopilot}
                      className="scale-75"
                    />
                  </div>
                </div>
                
                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="h-8 w-8 p-0 bg-[hsl(var(--kiro-purple))] hover:bg-[hsl(var(--kiro-purple))]/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Right Sidebar - Files Panel */}
      <div className={`transition-all duration-300 ${rightSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
        <div className="h-full bg-[hsl(var(--kiro-card))] border-l border-[hsl(var(--kiro-border))]">
          {/* Files Header */}
          <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--kiro-border))]">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[hsl(var(--kiro-text))]" />
              <h3 className="text-sm font-medium text-[hsl(var(--kiro-text))]">Files</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type to search"
                className="text-xs bg-[hsl(var(--kiro-bg))] border border-[hsl(var(--kiro-border))] rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--kiro-purple))]" 
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightSidebarOpen(false)}
                className="h-6 w-6 p-0 hover:bg-[hsl(var(--kiro-hover))]"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* File Categories */}
          <div className="p-4 space-y-1">
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <FileText className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Codebase</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <Code className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Code</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <BookOpen className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Docs</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <GitBranch className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Repository Map</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <Plus className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Git Diff</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <Terminal className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Terminal</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Problems</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <FolderOpen className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Folder</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <Globe className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">URL</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
              <FileText className="h-4 w-4 text-[hsl(var(--kiro-text-muted))]" />
              <span className="text-sm text-[hsl(var(--kiro-text))]">Current File</span>
            </div>
          </div>

          {/* Recent Files/Analysis */}
          {analysis && (
            <div className="border-t border-[hsl(var(--kiro-border))] p-4 space-y-3">
              <h4 className="text-xs font-medium text-[hsl(var(--kiro-text-muted))] uppercase tracking-wide">Recent Analysis</h4>
              
              {analysis.readSources?.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 hover:bg-[hsl(var(--kiro-hover))] rounded-lg cursor-pointer">
                  <FileText className="h-3 w-3 text-[hsl(var(--kiro-purple))]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[hsl(var(--kiro-text))] truncate">{source.name}</div>
                    <div className="text-xs text-[hsl(var(--kiro-text-muted))]">{source.type}</div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full text-white ${
                    source.status === 'processed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {source.status}
                  </span>
                </div>
              )) || []}
            </div>
          )}
            <div className="space-y-4">
              {analysis ? (
                <>
                  {/* Read Sources */}
                  <Card className="bg-[hsl(var(--kiro-bg))] border-[hsl(var(--kiro-border))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Read Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {analysis.readSources.map((source, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 text-xs">
                          <span>{source.name}</span>
                          <Badge variant="outline">{source.type}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Structured Notes */}
                  <Card className="bg-[hsl(var(--kiro-bg))] border-[hsl(var(--kiro-border))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Structured Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{analysis.structuredNotes.title}</h4>
                        <p className="text-xs text-[hsl(var(--kiro-text-muted))]">
                          {analysis.structuredNotes.summary}
                        </p>
                        {analysis.structuredNotes.sections.map((section, idx) => (
                          <div key={idx} className="pl-2 border-l border-[hsl(var(--kiro-border))]">
                            <div className="text-xs font-medium">{section.heading}</div>
                            <div className="text-xs text-[hsl(var(--kiro-text-muted))]">{section.content}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Concepts */}
                  <Card className="bg-[hsl(var(--kiro-bg))] border-[hsl(var(--kiro-border))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Key Concepts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {analysis.keyConcepts.map((concept, idx) => (
                          <div key={idx} className="p-2 bg-[hsl(var(--kiro-hover))] rounded text-xs">
                            <div className="font-medium">{concept.term}</div>
                            <div className="text-[hsl(var(--kiro-text-muted))]">{concept.definition}</div>
                            <div className="flex justify-end mt-1">
                              <Badge variant="outline" className="text-xs">
                                {concept.importance}/10
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Q&A Results */}
                  <Card className="bg-[hsl(var(--kiro-bg))] border-[hsl(var(--kiro-border))]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Q&A Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {analysis.qnaResults.map((qa, idx) => (
                          <div key={idx} className="p-2 bg-[hsl(var(--kiro-hover))] rounded text-xs">
                            <div className="font-medium text-[hsl(var(--kiro-purple))]">{qa.question}</div>
                            <div className="text-[hsl(var(--kiro-text-muted))] mt-1">{qa.answer}</div>
                            <div className="flex justify-end mt-1">
                              <Badge variant="outline" className="text-xs">
                                {qa.confidence}% confidence
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Options */}
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export DOCX
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export Markdown
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--kiro-text-muted))]" />
                  <p className="text-sm text-[hsl(var(--kiro-text-muted))]">
                    Start a conversation to see analysis results
                  </p>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Toggle buttons for closed sidebars */}
      {!rightSidebarOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRightSidebarOpen(true)}
          className="fixed right-2 top-1/2 transform -translate-y-1/2 hover:bg-[hsl(var(--kiro-hover))]"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}