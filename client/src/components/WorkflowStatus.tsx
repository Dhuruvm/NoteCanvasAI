import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export interface WorkflowStage {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  progress?: number;
  errorMessage?: string;
}

interface WorkflowStatusProps {
  stages: WorkflowStage[];
  className?: string;
}

export const WorkflowStatus: React.FC<WorkflowStatusProps> = ({ stages, className = '' }) => {
  const [visibleStages, setVisibleStages] = useState<string[]>([]);

  useEffect(() => {
    // Show stages progressively as they become active or complete
    const activeOrComplete = stages
      .filter(stage => stage.status === 'active' || stage.status === 'complete' || stage.status === 'error')
      .map(stage => stage.id);
    
    setVisibleStages(activeOrComplete);
  }, [stages]);

  return (
    <div className={`space-y-2 ${className}`}>
      {stages
        .filter(stage => visibleStages.includes(stage.id))
        .map((stage) => (
          <WorkflowStageItem key={stage.id} stage={stage} />
        ))}
    </div>
  );
};

const WorkflowStageItem: React.FC<{ stage: WorkflowStage }> = ({ stage }) => {
  const getStageIcon = () => {
    switch (stage.status) {
      case 'active':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStageStyle = () => {
    switch (stage.status) {
      case 'active':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
      case 'complete':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div 
      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2 ${getStageStyle()}`}
      data-testid={`workflow-stage-${stage.id}`}
    >
      {getStageIcon()}
      <div className="flex-1">
        <span className="text-sm font-medium">
          {stage.label}
        </span>
        {stage.progress !== undefined && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stage.progress}%` }}
            />
          </div>
        )}
        {stage.errorMessage && (
          <p className="text-xs mt-1 opacity-80">{stage.errorMessage}</p>
        )}
      </div>
    </div>
  );
};

// Predefined workflow stages for NoteGPT
export const createNoteGPTWorkflow = (): WorkflowStage[] => [
  {
    id: 'thinking',
    label: 'Thinking…',
    status: 'pending'
  },
  {
    id: 'composing',
    label: 'Composing…',
    status: 'pending'
  },
  {
    id: 'analyzing',
    label: 'Analyzing sources…',
    status: 'pending'
  },
  {
    id: 'summarizing',
    label: 'Summarizing',
    status: 'pending',
    progress: 0
  },
  {
    id: 'preparing',
    label: 'Preparing your notes…',
    status: 'pending'
  },
  {
    id: 'complete',
    label: 'Done — ready for review ✅',
    status: 'pending'
  }
];

// Helper function to update workflow stages
export const updateWorkflowStage = (
  stages: WorkflowStage[], 
  stageId: string, 
  updates: Partial<WorkflowStage>
): WorkflowStage[] => {
  return stages.map(stage => 
    stage.id === stageId ? { ...stage, ...updates } : stage
  );
};

// Helper function to advance workflow to next stage
export const advanceWorkflow = (stages: WorkflowStage[]): WorkflowStage[] => {
  const activeIndex = stages.findIndex(stage => stage.status === 'active');
  
  if (activeIndex === -1) {
    // Start first stage
    return updateWorkflowStage(stages, stages[0].id, { status: 'active' });
  }
  
  // Complete current stage and start next
  const nextIndex = activeIndex + 1;
  let updatedStages = updateWorkflowStage(stages, stages[activeIndex].id, { status: 'complete' });
  
  if (nextIndex < stages.length) {
    updatedStages = updateWorkflowStage(updatedStages, stages[nextIndex].id, { status: 'active' });
  }
  
  return updatedStages;
};

export default WorkflowStatus;