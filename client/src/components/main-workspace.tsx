import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProcessingStatus } from "./processing-status";
import { FileText, PaintbrushVertical, Eye, Download, FileType, Save, Share, Clock, Lightbulb, List, GitBranch, CheckCircle } from "lucide-react";
import type { Note, ProcessedNote } from "@shared/schema";

interface MainWorkspaceProps {
  noteId: number | null;
}

export function MainWorkspace({ noteId }: MainWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("notes");

  const { data: note, isLoading, error, refetch } = useQuery<Note>({
    queryKey: ["/api/notes", noteId],
    enabled: !!noteId,
    refetchInterval: (query) => {
      // Refetch every 2 seconds while processing
      return query.state.data?.status === "processing" ? 2000 : false;
    },
  });

  useEffect(() => {
    if (note && note.status === "completed") {
      setActiveTab("notes");
    }
  }, [note]);

  const handleDownloadPDF = async () => {
    if (!noteId) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note?.title || 'notes'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (!noteId) {
    return (
      <Card className="h-64 sm:h-96 flex items-center justify-center">
        <CardContent className="text-center px-4">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Ready to Generate Notes
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload a file or paste text content to get started with AI-powered note generation.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !note) {
    return (
      <div className="space-y-6">
        <ProcessingStatus status="processing" />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !note) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Note
          </h3>
          <p className="text-muted-foreground mb-4">
            Failed to load the note. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const processedContent = note.processedContent as ProcessedNote;

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      {note.status !== "completed" && (
        <ProcessingStatus status={note.status} />
      )}

      {/* Main Content */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TabsList className="px-3 sm:px-6 py-0 h-auto bg-transparent overflow-x-auto">
              <TabsTrigger
                value="notes"
                className="px-2 sm:px-4 py-3 sm:py-4 border-b-2 border-transparent data-[state=active]:border-primary text-sm whitespace-nowrap"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">AI Generated </span>Notes
              </TabsTrigger>
              <TabsTrigger
                value="designer"
                className="px-2 sm:px-4 py-3 sm:py-4 border-b-2 border-transparent data-[state=active]:border-primary text-sm whitespace-nowrap"
                disabled={note.status !== "completed"}
              >
                <PaintbrushVertical className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">PDF </span>Designer
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="px-2 sm:px-4 py-3 sm:py-4 border-b-2 border-transparent data-[state=active]:border-primary text-sm whitespace-nowrap"
                disabled={note.status !== "completed"}
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notes" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {note.status === "completed" && processedContent ? (
              <>
                {/* Generated Title */}
                <div className="border-l-4 border-accent pl-3 sm:pl-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {processedContent.title || note.title}
                  </h2>
                  <div className="text-muted-foreground text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Generated {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      From: {processedContent.metadata?.source || "Text input"}
                    </span>
                  </div>
                </div>

                {/* Key Concepts */}
                {processedContent.keyConcepts && processedContent.keyConcepts.length > 0 && (
                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Key Concepts
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {processedContent.keyConcepts.map((concept, index) => (
                          <Card key={index} className="bg-white dark:bg-gray-800 border">
                            <CardContent className="p-3">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{concept.title}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {concept.definition}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Points */}
                {processedContent.summaryPoints && processedContent.summaryPoints.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <List className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                      Summary Points
                    </h3>
                    
                    {processedContent.summaryPoints.map((section, index) => (
                      <div key={index} className="ml-2 sm:ml-4 border-l-2 border-primary pl-3 sm:pl-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm sm:text-base">{section.heading}</h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {section.points.map((point, pointIndex) => (
                            <li key={pointIndex} className="flex items-start text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-accent mr-2 mt-0.5 sm:mt-1 flex-shrink-0" />
                              <span className="text-xs sm:text-sm leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Process Flow */}
                {processedContent.processFlow && processedContent.processFlow.length > 0 && (
                  <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                        <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-secondary" />
                        Process Flow
                      </h3>
                      <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                        {processedContent.processFlow.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                {step.step}
                              </div>
                              <p className="text-xs text-center text-muted-foreground mt-1 sm:mt-2 max-w-16 sm:max-w-20">
                                {step.title}
                              </p>
                            </div>
                            {index < processedContent.processFlow!.length - 1 && (
                              <div className="text-muted-foreground text-sm sm:text-base">→</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 pt-4 border-t dark:border-gray-700">
                  <Button onClick={handleDownloadPDF} className="flex items-center justify-center text-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center text-sm" disabled>
                    <FileType className="w-4 h-4 mr-2" />
                    Export DOCX
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center text-sm" disabled>
                    <Save className="w-4 h-4 mr-2" />
                    Save as Template
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center text-sm" disabled>
                    <Share className="w-4 h-4 mr-2" />
                    Share Link
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="text-muted-foreground text-base sm:text-lg mb-4">
                  {note.status === "processing" ? "⏳" : "❌"}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {note.status === "processing" 
                    ? "AI is Processing Your Content" 
                    : "Processing Failed"}
                </h3>
                <p className="text-sm text-muted-foreground px-4">
                  {note.status === "processing" 
                    ? "Please wait while we generate your structured notes..."
                    : "There was an error processing your content. Please try again."}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="designer" className="p-3 sm:p-6">
            <div className="text-center py-8 sm:py-12">
              <PaintbrushVertical className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                PDF Designer
              </h3>
              <p className="text-sm text-muted-foreground px-4">
                Visual PDF customization tools coming soon. Currently, you can download the generated PDF above.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="p-3 sm:p-6">
            <div className="text-center py-8 sm:py-12">
              <Eye className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Preview Mode
              </h3>
              <p className="text-sm text-muted-foreground px-4">
                Live preview functionality coming soon. Use the download button to see the final PDF.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
