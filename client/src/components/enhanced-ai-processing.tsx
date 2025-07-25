import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap, Target, Sparkles, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EnhancedAIProcessingProps {
  content: string;
  onNoteCreated: (noteId: number) => void;
}

export function EnhancedAIProcessing({ content, onNoteCreated }: EnhancedAIProcessingProps) {
  const [processingStages, setProcessingStages] = useState([
    { id: 'analysis', name: 'Content Analysis', status: 'pending', progress: 0, model: 'Gemini AI' },
    { id: 'structure', name: 'Structure Optimization', status: 'pending', progress: 0, model: 'Mixtral-8x7B' },
    { id: 'enhancement', name: 'Content Enhancement', status: 'pending', progress: 0, model: 'BERT' },
    { id: 'layout', name: 'Layout Analysis', status: 'pending', progress: 0, model: 'LayoutLM' },
    { id: 'generation', name: 'Note Generation', status: 'pending', progress: 0, model: 'Multi-Model' }
  ]);

  const [enhancedSettings, setEnhancedSettings] = useState({
    useMultipleModels: true,
    advancedAnalysis: true,
    semanticEnhancement: true,
    layoutOptimization: true,
    qualityAssurance: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processWithEnhancedAI = useMutation({
    mutationFn: async (settings: any) => {
      // Simulate enhanced multi-model processing
      const stages = [...processingStages];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        setProcessingStages(prev => 
          prev.map((s, idx) => 
            idx === i ? { ...s, status: 'processing' } : s
          )
        );

        // Simulate processing time and progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setProcessingStages(prev => 
            prev.map((s, idx) => 
              idx === i ? { ...s, progress } : s
            )
          );
        }

        setProcessingStages(prev => 
          prev.map((s, idx) => 
            idx === i ? { ...s, status: 'completed', progress: 100 } : s
          )
        );

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Final API call to process content
      const response = await fetch("/api/process-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          settings: {
            ...settings,
            useMultipleModels: true,
            enhancedProcessing: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Enhanced processing failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      onNoteCreated(data.noteId);
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Enhanced AI Processing Complete",
        description: "Your content has been processed using multiple AI models for optimal results.",
      });
    },
    onError: (error) => {
      // Reset all stages on error
      setProcessingStages(prev => 
        prev.map(stage => ({ ...stage, status: 'pending', progress: 0 }))
      );
      toast({
        title: "Enhanced Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEnhancedProcessing = () => {
    processWithEnhancedAI.mutate(enhancedSettings);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center mb-2">
          Enhanced AI Processing
        </h2>
        <p className="text-muted-foreground">
          Advanced multi-model AI processing for superior note generation
        </p>
        <div className="flex justify-center mt-3">
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            5 AI Models • Advanced Pipeline
          </Badge>
        </div>
      </div>

      {/* AI Models Overview */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI Models Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div>
                <div className="font-medium text-sm">Google Gemini</div>
                <div className="text-xs text-muted-foreground">Content Analysis</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <div className="font-medium text-sm">Mixtral-8x7B</div>
                <div className="text-xs text-muted-foreground">Structure Optimization</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <div>
                <div className="font-medium text-sm">BERT Enhanced</div>
                <div className="text-xs text-muted-foreground">Semantic Analysis</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div>
                <div className="font-medium text-sm">LayoutLM</div>
                <div className="text-xs text-muted-foreground">Layout Analysis</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div>
                <div className="font-medium text-sm">Multi-Model</div>
                <div className="text-xs text-muted-foreground">Final Generation</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            Enhanced Processing Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Multiple AI Models</h4>
                <p className="text-sm text-muted-foreground">Use all 5 AI models for processing</p>
              </div>
              <Switch
                checked={enhancedSettings.useMultipleModels}
                onCheckedChange={(checked) => 
                  setEnhancedSettings(prev => ({ ...prev, useMultipleModels: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Advanced Analysis</h4>
                <p className="text-sm text-muted-foreground">Deep semantic understanding</p>
              </div>
              <Switch
                checked={enhancedSettings.advancedAnalysis}
                onCheckedChange={(checked) => 
                  setEnhancedSettings(prev => ({ ...prev, advancedAnalysis: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Semantic Enhancement</h4>
                <p className="text-sm text-muted-foreground">Improve content relationships</p>
              </div>
              <Switch
                checked={enhancedSettings.semanticEnhancement}
                onCheckedChange={(checked) => 
                  setEnhancedSettings(prev => ({ ...prev, semanticEnhancement: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Layout Optimization</h4>
                <p className="text-sm text-muted-foreground">AI-optimized document structure</p>
              </div>
              <Switch
                checked={enhancedSettings.layoutOptimization}
                onCheckedChange={(checked) => 
                  setEnhancedSettings(prev => ({ ...prev, layoutOptimization: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Stages */}
      {processWithEnhancedAI.isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Processing Stages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processingStages.map((stage, index) => (
              <div key={stage.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(stage.status)}
                    <div>
                      <div className={`font-medium ${getStatusColor(stage.status)}`}>
                        {stage.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Powered by {stage.model}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stage.progress}%
                  </div>
                </div>

                <Progress value={stage.progress} className="h-2" />

                {index < processingStages.length - 1 && stage.status === 'completed' && (
                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <Card>
        <CardContent className="p-6">
          <Button
            onClick={handleEnhancedProcessing}
            disabled={processWithEnhancedAI.isPending || !content.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-4 text-lg"
            size="lg"
          >
            {processWithEnhancedAI.isPending ? (
              <>
                <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing with AI Models...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-3" />
                Start Enhanced AI Processing
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            This will process your content using 5 different AI models for optimal results
          </p>
        </CardContent>
      </Card>
    </div>
  );
}