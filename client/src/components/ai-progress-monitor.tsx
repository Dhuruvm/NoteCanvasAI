import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Brain, Zap, Sparkles, Target, Eye } from "lucide-react";

interface AIProgressMonitorProps {
  isProcessing: boolean;
  isGeneratingPDF: boolean;
  currentStage?: string;
}

export function AIProgressMonitor({ isProcessing, isGeneratingPDF, currentStage }: AIProgressMonitorProps) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [stages, setStages] = useState([
    { id: 'analysis', name: 'Content Analysis', icon: Brain, status: 'pending', progress: 0 },
    { id: 'structure', name: 'Structure Generation', icon: Target, status: 'pending', progress: 0 },
    { id: 'enhancement', name: 'AI Enhancement', icon: Sparkles, status: 'pending', progress: 0 },
    { id: 'generation', name: 'Note Generation', icon: Zap, status: 'pending', progress: 0 },
    { id: 'finalization', name: 'Finalization', icon: CheckCircle, status: 'pending', progress: 0 }
  ]);

  useEffect(() => {
    if (isProcessing || isGeneratingPDF) {
      simulateProgress();
    } else {
      resetProgress();
    }
  }, [isProcessing, isGeneratingPDF]);

  const simulateProgress = async () => {
    const tasks = isGeneratingPDF 
      ? ['Analyzing layout...', 'Generating design...', 'Creating PDF...', 'Finalizing document...']
      : ['Analyzing content...', 'Structuring information...', 'Enhancing with AI...', 'Generating notes...'];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      setCurrentTask(task);
      
      // Update current stage
      setStages(prev => 
        prev.map((stage, index) => ({
          ...stage,
          status: index < i ? 'completed' : index === i ? 'processing' : 'pending',
          progress: index < i ? 100 : index === i ? 0 : 0
        }))
      );

      // Simulate progress for current stage
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!isProcessing && !isGeneratingPDF) break;
        
        setProgress((i * 100 + progress) / tasks.length);
        setStages(prev => 
          prev.map((stage, index) => 
            index === i ? { ...stage, progress } : stage
          )
        );
      }

      // Mark stage as completed
      setStages(prev => 
        prev.map((stage, index) => 
          index === i ? { ...stage, status: 'completed', progress: 100 } : stage
        )
      );
    }
  };

  const resetProgress = () => {
    setProgress(0);
    setCurrentTask("");
    setStages(prev => prev.map(stage => ({ ...stage, status: 'pending', progress: 0 })));
  };

  const getStatusIcon = (status: string, IconComponent: any) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <IconComponent className="w-5 h-5 text-gray-400" />;
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

  if (!isProcessing && !isGeneratingPDF) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <div className="w-5 h-5 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          {isGeneratingPDF ? 'Generating AI-Enhanced PDF' : 'Processing with AI Models'}
          <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {currentTask || (isGeneratingPDF ? 'Generating PDF...' : 'Processing content...')}
            </span>
            <span className="text-sm text-blue-700 dark:text-blue-400">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-3 bg-blue-100 dark:bg-blue-900" />
        </div>

        {/* Stage Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Processing Stages
          </h4>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center space-x-3">
                {getStatusIcon(stage.status, stage.icon)}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${getStatusColor(stage.status)}`}>
                    {stage.name}
                  </div>
                  {stage.status === 'processing' && (
                    <div className="mt-1">
                      <Progress value={stage.progress} className="h-1" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stage.status === 'completed' ? '✓' : stage.status === 'processing' ? `${stage.progress}%` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Models Indicator */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-900 dark:text-blue-300">
              AI Models Active
            </span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Gemini AI</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Mixtral-8x7B</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 rounded-full bg-orange-500"></div>
              <span className="text-gray-600 dark:text-gray-400">BERT Enhanced</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 rounded-full bg-purple-500"></div>
              <span className="text-gray-600 dark:text-gray-400">LayoutLM</span>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Estimated: {isGeneratingPDF ? '2-3 minutes' : '30-60 seconds'}
          </div>
          <div className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            Real-time processing
          </div>
        </div>
      </CardContent>
    </Card>
  );
}