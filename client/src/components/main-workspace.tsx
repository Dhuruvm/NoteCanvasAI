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
    refetchInterval: (data) => {
      // Refetch every 2 seconds while processing
      return data?.status === "processing" ? 2000 : false;
    },
  });

  useEffect(() => {
    if (note?.status === "completed") {
      setActiveTab("notes");
    }
  }, [note?.status]);

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
      <Card className="h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to Generate Notes
          </h3>
          <p className="text-muted-foreground">
            Upload a file or paste text content to get started with AI-powered note generation.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ProcessingStatus status="processing" />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
          <div className="border-b border-gray-200">
            <TabsList className="px-6 py-0 h-auto bg-transparent">
              <TabsTrigger
                value="notes"
                className="px-4 py-4 border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <FileText className="w-4 h-4 mr-2" />
                AI Generated Notes
              </TabsTrigger>
              <TabsTrigger
                value="designer"
                className="px-4 py-4 border-b-2 border-transparent data-[state=active]:border-primary"
                disabled={note.status !== "completed"}
              >
                <PaintbrushVertical className="w-4 h-4 mr-2" />
                PDF Designer
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="px-4 py-4 border-b-2 border-transparent data-[state=active]:border-primary"
                disabled={note.status !== "completed"}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notes" className="p-6 space-y-6">
            {note.status === "completed" && processedContent ? (
              <>
                {/* Generated Title */}
                <div className="border-l-4 border-accent pl-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {processedContent.title || note.title}
                  </h2>
                  <p className="text-muted-foreground text-sm flex items-center gap-4">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Generated {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      From: {processedContent.metadata?.source || "Text input"}
                    </span>
                  </p>
                </div>

                {/* Key Concepts */}
                {processedContent.keyConcepts && processedContent.keyConcepts.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2" />
                        Key Concepts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {processedContent.keyConcepts.map((concept, index) => (
                          <Card key={index} className="bg-white border">
                            <CardContent className="p-3">
                              <h4 className="font-medium text-gray-900">{concept.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
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
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <List className="w-5 h-5 mr-2 text-primary" />
                      Summary Points
                    </h3>
                    
                    {processedContent.summaryPoints.map((section, index) => (
                      <div key={index} className="ml-4 border-l-2 border-primary pl-4">
                        <h4 className="font-semibold text-gray-800 mb-2">{section.heading}</h4>
                        <ul className="space-y-2">
                          {section.points.map((point, pointIndex) => (
                            <li key={pointIndex} className="flex items-start text-gray-700">
                              <CheckCircle className="w-4 h-4 text-accent mr-2 mt-0.5 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Process Flow */}
                {processedContent.processFlow && processedContent.processFlow.length > 0 && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <GitBranch className="w-5 h-5 mr-2 text-secondary" />
                        Process Flow
                      </h3>
                      <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                        {processedContent.processFlow.map((step, index) => (
                          <div key={index} className="flex items-center space-x-4 flex-shrink-0">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {step.step}
                              </div>
                              <p className="text-xs text-center text-muted-foreground mt-2 max-w-20">
                                {step.title}
                              </p>
                            </div>
                            {index < processedContent.processFlow!.length - 1 && (
                              <div className="text-muted-foreground">→</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button onClick={handleDownloadPDF} className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="flex items-center" disabled>
                    <FileType className="w-4 h-4 mr-2" />
                    Export DOCX
                  </Button>
                  <Button variant="outline" className="flex items-center" disabled>
                    <Save className="w-4 h-4 mr-2" />
                    Save as Template
                  </Button>
                  <Button variant="outline" className="flex items-center" disabled>
                    <Share className="w-4 h-4 mr-2" />
                    Share Link
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg mb-4">
                  {note.status === "processing" ? "⏳" : "❌"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {note.status === "processing" 
                    ? "AI is Processing Your Content" 
                    : "Processing Failed"}
                </h3>
                <p className="text-muted-foreground">
                  {note.status === "processing" 
                    ? "Please wait while we generate your structured notes..."
                    : "There was an error processing your content. Please try again."}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="designer" className="p-6">
            <div className="text-center py-12">
              <PaintbrushVertical className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                PDF Designer
              </h3>
              <p className="text-muted-foreground">
                Visual PDF customization tools coming soon. Currently, you can download the generated PDF above.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="p-6">
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preview Mode
              </h3>
              <p className="text-muted-foreground">
                Live preview functionality coming soon. Use the download button to see the final PDF.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
