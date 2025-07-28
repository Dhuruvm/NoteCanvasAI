import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProcessingStatus } from "./processing-status";
import { FileText, PaintbrushVertical, Eye, Clock, Lightbulb, List, GitBranch, CheckCircle } from "lucide-react";
import type { Note, ProcessedNote } from "@shared/schema";
import { PDFDesignerEnhanced } from "./pdf-designer-enhanced";
import { VisualPreview } from "./visual-preview";
import logoImage from "../assets/notegpt-logo.png";

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

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfOptions, setPdfOptions] = useState({
    designStyle: 'modern' as 'academic' | 'modern' | 'minimal' | 'colorful',
    colorScheme: 'blue',
    includeVisualElements: true,
    useEnhancedLayout: true
  });

  const handleGeneratePDF = async () => {
    if (!noteId || !note) return;

    setIsGeneratingPDF(true);

    try {
      // Use enhanced PDF generation with multiple AI models
      const response = await fetch(`/api/notes/${noteId}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfOptions),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'PDF generation failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Verify we got a PDF blob
      if (blob.size === 0) {
        throw new Error('Empty PDF file received');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'enhanced-notes'}-ai-generated.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert(`AI-enhanced PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!noteId) {
    return (
      <div className="h-96 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Ready to Generate Notes
          </h3>
          <p className="text-gray-400 max-w-sm">
            Upload a file or paste text content to get started with AI-powered note generation.
          </p>
        </div>
      </div>
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
      {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            {/* Conditionally render the rest of the header items based on noteId */}
          </div>
        </div>
      {/* Processing Status */}
      {note.status !== "completed" && (
        <ProcessingStatus status={note.status} />
      )}

      {/* Main Content */}
      <div className="bg-gray-900 rounded-xl border border-gray-700">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-700 bg-gray-800/50">
            <TabsList className="px-6 py-0 h-auto bg-transparent overflow-x-auto w-full justify-start">
              <TabsTrigger
                value="notes"
                className="px-4 py-4 border-b-2 border-transparent data-[state=active]:border-cyan-500 text-gray-400 data-[state=active]:text-white text-sm whitespace-nowrap bg-transparent"
              >
                <FileText className="w-4 h-4 mr-2" />
                AI Generated Notes
              </TabsTrigger>

              <TabsTrigger
                value="designer"
                className="px-4 py-4 border-b-2 border-transparent data-[state=active]:border-cyan-500 text-gray-400 data-[state=active]:text-white text-sm whitespace-nowrap bg-transparent"
                disabled={note.status !== "completed"}
              >
                <PaintbrushVertical className="w-4 h-4 mr-2" />
                PDF Designer
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="px-4 py-4 border-b-2 border-transparent data-[state=active]:border-cyan-500 text-gray-400 data-[state=active]:text-white text-sm whitespace-nowrap bg-transparent"
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
                <div className="border-l-4 border-cyan-500 pl-4 bg-gray-800/30 p-4 rounded-r-lg">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {processedContent.title || note.title}
                  </h2>
                  <div className="text-gray-400 text-sm flex items-center gap-4">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
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

                {/* Enhanced PDF Generation */}
                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      AI-Enhanced PDF Generation
                      {processedContent.metadata?.aiModelsUsed?.includes('mixtral-8x7b-instruct') && (
                        <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          Multi-Model AI
                        </Badge>
                      )}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Design Style</label>
                        <select 
                          value={pdfOptions.designStyle} 
                          onChange={(e) => setPdfOptions({...pdfOptions, designStyle: e.target.value as any})}
                          className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        >
                          <option value="academic">Academic</option>
                          <option value="modern">Modern</option>
                          <option value="minimal">Minimal</option>
                          <option value="colorful">Colorful</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Scheme</label>
                        <select 
                          value={pdfOptions.colorScheme} 
                          onChange={(e) => setPdfOptions({...pdfOptions, colorScheme: e.target.value})}
                          className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        >
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="purple">Purple</option>
                          <option value="orange">Orange</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visual Elements</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={pdfOptions.includeVisualElements}
                            onChange={(e) => setPdfOptions({...pdfOptions, includeVisualElements: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Include charts & diagrams</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enhanced Layout</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={pdfOptions.useEnhancedLayout}
                            onChange={(e) => setPdfOptions({...pdfOptions, useEnhancedLayout: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">AI-optimized design</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleGeneratePDF} 
                      disabled={isGeneratingPDF}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating AI-Enhanced PDF...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate AI-Enhanced PDF
                        </>
                      )}
                    </Button>

                    {processedContent.metadata?.aiModelsUsed && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Powered by: {processedContent.metadata.aiModelsUsed.join(', ')}
                      </p>
                    )}
                  </div>
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
            <PDFDesignerEnhanced 
              note={processedContent}
              onGeneratePDF={handleGeneratePDF}
              isGenerating={isGeneratingPDF}
            />
          </TabsContent>

          <TabsContent value="preview" className="p-3 sm:p-6">
            <VisualPreview 
              noteId={note.id}
              processedContent={processedContent}
              pdfOptions={{
                designStyle: 'modern',
                colorScheme: 'blue',
                includeVisualElements: true,
                includeCharts: true,
                includeInfographic: true
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}