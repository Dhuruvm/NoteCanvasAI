import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { UploadZone } from "./upload-zone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Send, Plus, Paperclip, Sparkles, Zap, Brain } from "lucide-react";

interface InputPanelProps {
  onNoteCreated: (noteId: number) => void;
}

export function InputPanel({ onNoteCreated }: InputPanelProps) {
  const [textContent, setTextContent] = useState("");
  const [summaryStyle, setSummaryStyle] = useState<"academic" | "bulletPoints" | "mindMap" | "qna">("academic");
  const [showSettings, setShowSettings] = useState(false);

  const { toast } = useToast();

  const processTextMutation = useMutation({
    mutationFn: async (data: { content: string; settings: any }) => {
      const response = await apiRequest("POST", "/api/process", data);
      return response.json();
    },
    onSuccess: (data) => {
      onNoteCreated(data.noteId);
      toast({
        title: "Processing Started",
        description: "Your content is being processed with AI. This may take a few moments.",
      });
      setTextContent("");
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      onNoteCreated(data.noteId);
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded and is being processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("templateId", summaryStyle);
    uploadMutation.mutate(formData);
  };

  const handleGenerateNotes = () => {
    if (!textContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some text content to generate notes.",
        variant: "destructive",
      });
      return;
    }

    processTextMutation.mutate({
      content: textContent,
      settings: {
        summaryStyle,
        detailLevel: 3,
        includeExamples: true,
        useMultipleModels: false,
        designStyle: "modern",
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateNotes();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Generate AI Notes</h2>
        <p className="text-gray-400">Upload a file or paste text to create structured study notes</p>
      </div>

      {/* File Upload Section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-300">Upload Document</Label>
        <UploadZone 
          onFileUpload={handleFileUpload}
          isUploading={uploadMutation.isPending}
        />
      </div>

      {/* Text Input Section */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-300">Or enter text content</Label>
        
        {/* Modern Chat-like Input */}
        <div className="relative">
          <div className="relative bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden focus-within:border-cyan-500 transition-colors">
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your content here or describe what you'd like to learn about..."
              className="min-h-[120px] max-h-[300px] bg-transparent border-0 text-white placeholder-gray-400 resize-none focus:ring-0 focus:border-0 p-4 pr-16"
            />
            
            {/* Input Actions */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleGenerateNotes}
                disabled={!textContent.trim() || processTextMutation.isPending}
                size="sm"
                className="h-8 w-8 p-0 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50"
              >
                {processTextMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Character Count */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{textContent.length} characters</span>
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
              AI Processing Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Note Style</Label>
              <Select value={summaryStyle} onValueChange={(value: any) => setSummaryStyle(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="academic" className="text-white">Academic Summary</SelectItem>
                  <SelectItem value="bulletPoints" className="text-white">Bullet Points</SelectItem>
                  <SelectItem value="mindMap" className="text-white">Mind Map</SelectItem>
                  <SelectItem value="qna" className="text-white">Q&A Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 bg-gray-800/50"
        >
          <Brain className="w-4 h-4 mr-2" />
          Quick Summary
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 bg-gray-800/50"
        >
          <Zap className="w-4 h-4 mr-2" />
          Flash Cards
        </Button>
      </div>
    </div>
  );
}