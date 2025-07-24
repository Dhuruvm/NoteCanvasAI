import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { UploadZone } from "./upload-zone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Sliders, Mic, Sparkles, Brain, Zap } from "lucide-react";

interface InputPanelProps {
  onNoteCreated: (noteId: number) => void;
}

export function InputPanel({ onNoteCreated }: InputPanelProps) {
  const [textContent, setTextContent] = useState("");
  const [summaryStyle, setSummaryStyle] = useState<"academic" | "bulletPoints" | "mindMap" | "qna">("academic");
  const [detailLevel, setDetailLevel] = useState([3]);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [useMultipleModels, setUseMultipleModels] = useState(false);
  const [designStyle, setDesignStyle] = useState<"academic" | "modern" | "minimal" | "colorful">("modern");

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
        detailLevel: detailLevel[0],
        includeExamples,
        useMultipleModels: false,
        designStyle,
      },
    });
  };

  const handleEnhancedProcessing = () => {
    if (!textContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some text content for enhanced AI processing.",
        variant: "destructive",
      });
      return;
    }

    processTextMutation.mutate({
      content: textContent,
      settings: {
        summaryStyle,
        detailLevel: detailLevel[0],
        includeExamples,
        useMultipleModels: true,
        designStyle,
        enhancedProcessing: true,
        advancedAnalysis: true,
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2" />
            Input Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <UploadZone
            onFileUpload={handleFileUpload}
            isUploading={uploadMutation.isPending}
          />
          
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Or paste your text:
            </Label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-24 sm:min-h-32 resize-none text-sm"
              placeholder="Paste your notes, articles, or any text content here..."
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="w-full" disabled>
              <Mic className="w-4 h-4 mr-2" />
              <span className="text-sm">Voice Input</span>
            </Button>
            <Button
              onClick={handleGenerateNotes}
              disabled={processTextMutation.isPending || !textContent.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-sm">{processTextMutation.isPending ? "Processing..." : "Generate Notes"}</span>
            </Button>
            <Button
              onClick={handleEnhancedProcessing}
              disabled={processTextMutation.isPending || !textContent.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              <span className="text-sm">{processTextMutation.isPending ? "AI Enhanced" : "AI Enhanced"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-secondary mr-2" />
            AI Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Summary Style
            </Label>
            <Select value={summaryStyle} onValueChange={(value: any) => setSummaryStyle(value)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic Style</SelectItem>
                <SelectItem value="bulletPoints">Bullet Points</SelectItem>
                <SelectItem value="mindMap">Mind Map Format</SelectItem>
                <SelectItem value="qna">Q&A Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Detail Level
            </Label>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Slider
                value={detailLevel}
                onValueChange={setDetailLevel}
                max={5}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-xs sm:text-sm text-muted-foreground w-12 sm:w-16 text-right">
                {detailLevel[0] === 5 ? "Detailed" : detailLevel[0] === 1 ? "Brief" : "Medium"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Include Examples
            </Label>
            <Switch
              checked={includeExamples}
              onCheckedChange={setIncludeExamples}
            />
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-2 text-purple-600" />
                <Label className="text-sm font-medium text-purple-900 dark:text-purple-300">
                  Multi-Model AI Processing
                </Label>
              </div>
              <Switch
                checked={useMultipleModels}
                onCheckedChange={setUseMultipleModels}
              />
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Use 5 AI models (Gemini, Mixtral, BERT, LayoutLM) for enhanced analysis
            </p>
          </div>
          
          {useMultipleModels && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Design Style
              </Label>
              <Select value={designStyle} onValueChange={(value: any) => setDesignStyle(value)}>
                <SelectTrigger className="text-sm">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
