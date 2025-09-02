import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, FileText, Brain, Wand2, Download, Eye, MessageSquare, 
  Settings, Palette, Type, Layout, Zap, Clock, CheckCircle,
  AlertCircle, Loader2, FileImage, File, FileType
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface GeneratedNote {
  id: string;
  title: string;
  content: any;
  processedContent: any;
  createdAt: string;
  settings: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function NoteGPTWorkspace() {
  const [activeTab, setActiveTab] = useState('input');
  const [inputText, setInputText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [generatedNote, setGeneratedNote] = useState<GeneratedNote | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('modern-card');
  const [aiSettings, setAiSettings] = useState({
    summaryStyle: 'academic',
    detailLevel: 3,
    includeExamples: true,
    useMultipleModels: true,
    designStyle: 'modern'
  });
  const [documentPreview, setDocumentPreview] = useState('');
  const { toast } = useToast();

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

  // File upload configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
      toast({
        title: "Files uploaded",
        description: `${acceptedFiles.length} files added successfully`,
      });
    },
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Process content with AI
  const processContent = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) {
      toast({
        title: "No content to process",
        description: "Please enter text or upload files to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setActiveTab('processing');
    
    try {
      // Stage 1: Upload/Content preparation
      updateStageStatus('upload', 'processing');
      await delay(1000);
      updateStageStatus('upload', 'completed');
      setCurrentStage(1);

      // Stage 2: Text extraction (if files)
      if (uploadedFiles.length > 0) {
        updateStageStatus('extract', 'processing');
        const extractedContent = await extractTextFromFiles();
        await delay(1500);
        updateStageStatus('extract', 'completed');
        setCurrentStage(2);
      } else {
        updateStageStatus('extract', 'completed');
        setCurrentStage(2);
      }

      // Stage 3: AI Analysis
      updateStageStatus('ai-analysis', 'processing');
      const aiResponse = await processWithAI();
      await delay(2000);
      updateStageStatus('ai-analysis', 'completed');
      setCurrentStage(3);

      // Stage 4: Structure content
      updateStageStatus('structure', 'processing');
      const structuredDocument = await structureContent(aiResponse);
      await delay(1000);
      updateStageStatus('structure', 'completed');
      setCurrentStage(4);

      // Stage 5: Apply template
      updateStageStatus('template', 'processing');
      const styledDocument = await applyTemplate(structuredDocument);
      await delay(1500);
      updateStageStatus('template', 'completed');
      setCurrentStage(5);

      // Stage 6: Generate documents
      updateStageStatus('generation', 'processing');
      await generateDocuments(styledDocument);
      updateStageStatus('generation', 'completed');
      setCurrentStage(6);

      setGeneratedNote({
        id: Date.now().toString(),
        title: styledDocument.meta.title,
        content: inputText,
        processedContent: aiResponse,
        createdAt: new Date().toISOString(),
        settings: aiSettings
      });

      setActiveTab('results');
      toast({
        title: "Processing completed!",
        description: "Your note has been generated successfully.",
      });

    } catch (error) {
      console.error('Processing error:', error);
      updateStageStatus(processingStages[currentStage]?.id, 'error');
      toast({
        title: "Processing failed",
        description: "An error occurred while processing your content.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStageStatus = (stageId: string, status: ProcessingStage['status']) => {
    setProcessingStages(prev => 
      prev.map(stage => 
        stage.id === stageId ? { ...stage, status } : stage
      )
    );
  };

  const extractTextFromFiles = async () => {
    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append('files', file));
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('File upload failed');
    return await response.json();
  };

  const processWithAI = async () => {
    const response = await fetch('/api/notegpt/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: inputText,
        settings: aiSettings
      })
    });
    
    if (!response.ok) throw new Error('AI processing failed');
    return await response.json();
  };

  const structureContent = async (aiResponse: any) => {
    // Convert AI response to structured document format
    const blocks = [];
    
    if (aiResponse.processedContent?.summaryPoints) {
      blocks.push({
        id: 'summary',
        type: 'heading',
        level: 1,
        text: 'Summary',
        importance: 0.9
      });
      
      aiResponse.processedContent.summaryPoints.forEach((point: any, index: number) => {
        blocks.push({
          id: `summary-${index}`,
          type: 'paragraph',
          text: typeof point === 'string' ? point : point.text || point.heading,
          importance: 0.7
        });
      });
    }

    if (aiResponse.processedContent?.keyConcepts) {
      blocks.push({
        id: 'concepts',
        type: 'heading',
        level: 2,
        text: 'Key Concepts',
        importance: 0.8
      });

      blocks.push({
        id: 'concepts-list',
        type: 'list',
        ordered: false,
        items: aiResponse.processedContent.keyConcepts.map((concept: any) => 
          `${concept.title || concept.concept}: ${concept.definition || concept.description}`
        ),
        importance: 0.6
      });
    }

    return {
      meta: {
        title: aiResponse.title || 'Generated Notes',
        author: 'NoteGPT AI',
        date: new Date().toISOString().split('T')[0],
        tags: ['ai-generated', 'notes']
      },
      outline: [],
      blocks,
      styles: {
        theme: selectedTheme,
        palette: ['#0B2140', '#19E7FF', '#F6F8FA'],
        fontPair: {
          heading: 'Inter',
          body: 'Roboto'
        },
        spacing: 'normal',
        pageSize: 'A4'
      }
    };
  };

  const applyTemplate = async (document: any) => {
    const response = await fetch('/api/templates/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(document)
    });
    
    if (!response.ok) throw new Error('Template validation failed');
    const result = await response.json();
    return result.document;
  };

  const generateDocuments = async (document: any) => {
    // Generate HTML preview
    const previewResponse = await fetch('/api/templates/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document,
        options: { format: 'html', includeAnnotations: true, includeTOC: true }
      })
    });
    
    if (previewResponse.ok) {
      const html = await previewResponse.text();
      setDocumentPreview(html);
    }
  };

  const downloadPDF = async () => {
    if (!generatedNote) return;
    
    try {
      const document = await structureContent(generatedNote.processedContent);
      const response = await fetch('/api/templates/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document,
          options: { format: 'pdf', includeAnnotations: true, includeTOC: true, pageNumbers: true }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generatedNote.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !generatedNote) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      const response = await fetch('/api/notegpt/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context: generatedNote.processedContent,
          noteId: generatedNote.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat failed",
        description: "Unable to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            NoteGPT Workspace
          </h1>
          <p className="text-muted-foreground mt-2">Transform any content into beautiful, structured notes with AI</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Zap className="w-4 h-4 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Input
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Input Tab */}
        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Text Input
                </CardTitle>
                <CardDescription>Enter or paste your content here</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your text content here. You can paste articles, notes, or any text you want to transform into structured notes..."
                  className="min-h-[300px]"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <div className="mt-4 text-sm text-muted-foreground">
                  {inputText.length} characters
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  File Upload
                </CardTitle>
                <CardDescription>Upload PDFs, documents, or text files</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports PDF, TXT, MD, DOC, DOCX (max 10MB)
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Uploaded Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <File className="w-4 h-4 mr-2" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={processContent} 
              disabled={isProcessing}
              size="lg"
              className="px-8"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Generate Notes with AI'}
            </Button>
          </div>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Processing Pipeline
              </CardTitle>
              <CardDescription>
                Your content is being processed through our multi-stage AI pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {processingStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {stage.status === 'completed' && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                      {stage.status === 'processing' && (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      )}
                      {stage.status === 'error' && (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                      {stage.status === 'pending' && (
                        <Clock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{stage.name}</h4>
                        <Badge
                          variant={
                            stage.status === 'completed' ? 'default' :
                            stage.status === 'processing' ? 'secondary' :
                            stage.status === 'error' ? 'destructive' : 'outline'
                          }
                        >
                          {stage.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Progress value={(currentStage / processingStages.length) * 100} className="w-full" />
              
              <div className="text-center text-sm text-muted-foreground">
                Stage {currentStage + 1} of {processingStages.length}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {generatedNote ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Eye className="w-5 h-5 mr-2" />
                        Document Preview
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadPDF}>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg bg-white h-[600px]">
                      {documentPreview ? (
                        <iframe
                          srcDoc={documentPreview}
                          className="w-full h-full border-0 rounded-lg"
                          title="Document Preview"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <FileText className="w-12 h-12 mx-auto mb-4" />
                            <p>Generating preview...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Note Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Title</Label>
                      <p className="text-sm text-muted-foreground">{generatedNote.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(generatedNote.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Theme</Label>
                      <p className="text-sm text-muted-foreground">{selectedTheme}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">AI Settings</Label>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Style: {aiSettings.summaryStyle}</p>
                        <p>Detail Level: {aiSettings.detailLevel}/5</p>
                        <p>Multi-model: {aiSettings.useMultipleModels ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('chat')}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat with AI about this note
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileImage className="w-4 h-4 mr-2" />
                      Export as HTML
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Type className="w-4 h-4 mr-2" />
                      Change Theme
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No notes generated yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Process some content to see your AI-generated notes here
                  </p>
                  <Button onClick={() => setActiveTab('input')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat with AI about your notes
              </CardTitle>
              <CardDescription>
                Ask questions, request modifications, or get explanations about your generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <p>Start a conversation about your notes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask about your notes, request changes, or get explanations..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    disabled={!generatedNote}
                  />
                  <Button onClick={sendChatMessage} disabled={!generatedNote || !chatInput.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Processing Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Summary Style</Label>
                  <Select value={aiSettings.summaryStyle} onValueChange={(value) => 
                    setAiSettings(prev => ({ ...prev, summaryStyle: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="bulletPoints">Bullet Points</SelectItem>
                      <SelectItem value="mindMap">Mind Map</SelectItem>
                      <SelectItem value="qna">Q&A Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Detail Level: {aiSettings.detailLevel}/5</Label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={aiSettings.detailLevel}
                    onChange={(e) => setAiSettings(prev => ({ 
                      ...prev, 
                      detailLevel: parseInt(e.target.value) 
                    }))}
                    className="w-full mt-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="multiModel"
                    checked={aiSettings.useMultipleModels}
                    onChange={(e) => setAiSettings(prev => ({ 
                      ...prev, 
                      useMultipleModels: e.target.checked 
                    }))}
                  />
                  <Label htmlFor="multiModel">Use Multiple AI Models</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Design Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern-card">Modern Card</SelectItem>
                      <SelectItem value="classic-report">Classic Report</SelectItem>
                      <SelectItem value="compact-notes">Compact Notes</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Design Style</Label>
                  <Select value={aiSettings.designStyle} onValueChange={(value) => 
                    setAiSettings(prev => ({ ...prev, designStyle: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="colorful">Colorful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}