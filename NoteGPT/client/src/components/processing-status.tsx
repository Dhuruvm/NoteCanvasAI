import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface ProcessingStatusProps {
  status: "processing" | "completed" | "failed";
  title?: string;
}

export function ProcessingStatus({ status, title }: ProcessingStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "processing":
        return {
          icon: <Clock className="w-5 h-5 animate-spin" />,
          title: "Processing your content...",
          description: "Analyzing and generating structured notes",
          progress: 75,
          bgColor: "from-primary/10 to-secondary/10",
          borderColor: "border-primary/20",
        };
      case "completed":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          title: "Notes generated successfully!",
          description: "Your study notes are ready",
          progress: 100,
          bgColor: "from-accent/10 to-emerald-100",
          borderColor: "border-accent/20",
        };
      case "failed":
        return {
          icon: <XCircle className="w-5 h-5" />,
          title: "Processing failed",
          description: "There was an error generating your notes",
          progress: 0,
          bgColor: "from-destructive/10 to-red-100",
          borderColor: "border-destructive/20",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`bg-gradient-to-r ${config.bgColor} border ${config.borderColor}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={status === "completed" ? "text-green-600 dark:text-green-400" : status === "failed" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs sm:text-sm font-medium truncate ${
              status === "completed" ? "text-accent" : 
              status === "failed" ? "text-destructive" : 
              "text-primary"
            }`}>
              {title || config.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {config.description}
            </p>
          </div>
        </div>
        {status === "processing" && (
          <div className="mt-2 sm:mt-3">
            <Progress value={config.progress} className="h-1.5 sm:h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
