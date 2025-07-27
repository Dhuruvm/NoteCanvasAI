import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Sparkles, RefreshCw, Zap, Brain, Settings } from "lucide-react";
import type { ProcessedNote } from "@shared/schema";

interface AIPreviewProps {
  note: ProcessedNote | null;
}

export function AIPreview({ note }: AIPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'structured' | 'formatted' | 'interactive'>('structured');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [enhancedPreview, setEnhancedPreview] = useState<any>(null);

  useEffect(() => {
    if (note) {
      generateEnhancedPreview();
    }
  }, [note]);

  const generateEnhancedPreview = async () => {
    if (!note) return;
    
    setIsGeneratingPreview(true);
    
    try {
      // Simulate AI-enhanced preview generation
      setTimeout(() => {
        setEnhancedPreview({
          structuredView: generateStructuredView(note),
          formattedView: generateFormattedView(note),
          interactiveView: generateInteractiveView(note),
          aiInsights: generateAIInsights(note)
        });
        setIsGeneratingPreview(false);
      }, 1500);
    } catch (error) {
      console.error('Preview generation failed:', error);
      setIsGeneratingPreview(false);
    }
  };

  const generateStructuredView = (note: ProcessedNote) => {
    return {
      hierarchy: [
        { level: 1, title: note.title, type: 'main-heading' },
        ...(note.keyConcepts?.map((concept, i) => ({
          level: 2,
          title: concept.title,
          type: 'concept',
          content: concept.definition,
          index: i
        })) || []),
        ...(note.summaryPoints?.map((section, i) => ({
          level: 2,
          title: section.heading,
          type: 'summary',
          points: section.points,
          index: i
        })) || [])
      ],
      metadata: {
        wordCount: calculateWordCount(note),
        readingTime: calculateReadingTime(note),
        conceptCount: note.keyConcepts?.length || 0,
        sectionCount: note.summaryPoints?.length || 0
      }
    };
  };

  const generateFormattedView = (note: ProcessedNote) => {
    return {
      htmlContent: formatNoteAsHTML(note),
      styling: {
        theme: 'academic',
        typography: 'serif',
        colorScheme: 'blue'
      }
    };
  };

  const generateInteractiveView = (note: ProcessedNote) => {
    return {
      sections: note.summaryPoints?.map((section, i) => ({
        id: `section-${i}`,
        title: section.heading,
        points: section.points,
        expandable: true,
        interactive: true
      })) || [],
      concepts: note.keyConcepts?.map((concept, i) => ({
        id: `concept-${i}`,
        title: concept.title,
        definition: concept.definition,
        clickable: true,
        relatedConcepts: []
      })) || []
    };
  };

  const generateAIInsights = (note: ProcessedNote) => {
    return {
      complexity: 'Medium',
      studyTime: '15-20 minutes',
      keyTopics: note.keyConcepts?.slice(0, 3).map(c => c.title) || [],
      suggestions: [
        'Consider creating flashcards for key concepts',
        'Practice explaining concepts in your own words',
        'Review the process flow to understand relationships'
      ]
    };
  };

  const calculateWordCount = (note: ProcessedNote) => {
    let count = 0;
    if (note.keyConcepts) {
      count += note.keyConcepts.reduce((acc, concept) => 
        acc + (concept.title?.split(' ').length || 0) + (concept.definition?.split(' ').length || 0), 0);
    }
    if (note.summaryPoints) {
      count += note.summaryPoints.reduce((acc, section) => 
        acc + (section.heading?.split(' ').length || 0) + 
        section.points.reduce((pAcc, point) => pAcc + (point.split(' ').length || 0), 0), 0);
    }
    return count;
  };

  const calculateReadingTime = (note: ProcessedNote) => {
    const wordCount = calculateWordCount(note);
    return Math.ceil(wordCount / 200); // Assuming 200 words per minute
  };

  const formatNoteAsHTML = (note: ProcessedNote) => {
    let html = `<h1 class="main-title">${note.title}</h1>`;
    
    if (note.keyConcepts && note.keyConcepts.length > 0) {
      html += '<h2 class="section-title">Key Concepts</h2>';
      note.keyConcepts.forEach(concept => {
        html += `
          <div class="concept-block">
            <h3 class="concept-title">${concept.title}</h3>
            <p class="concept-definition">${concept.definition}</p>
          </div>
        `;
      });
    }
    
    if (note.summaryPoints && note.summaryPoints.length > 0) {
      html += '<h2 class="section-title">Summary Points</h2>';
      note.summaryPoints.forEach(section => {
        html += `<h3 class="subsection-title">${section.heading}</h3><ul class="points-list">`;
        section.points.forEach(point => {
          html += `<li class="point-item">${point}</li>`;
        });
        html += '</ul>';
      });
    }
    
    return html;
  };

  if (!note) {
    return (
      <div className="text-center py-12">
        <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI Preview
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate notes to see AI-enhanced preview options.
        </p>
      </div>
    );
  }

  // Show preview for all notes, not just completed ones

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Eye className="w-6 h-6 mr-2 text-green-600" />
            AI Preview
          </h2>
          <p className="text-muted-foreground mt-1">
            Enhanced content preview with AI insights and analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
            AI-Enhanced
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={generateEnhancedPreview}
            disabled={isGeneratingPreview}
          >
            {isGeneratingPreview ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Preview Mode Selector */}
      <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {[
          { key: 'structured', label: 'Structured', icon: Settings },
          { key: 'formatted', label: 'Formatted', icon: Sparkles },
          { key: 'interactive', label: 'Interactive', icon: Zap }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setPreviewMode(key as any)}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
              previewMode === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* AI Insights Panel */}
      {enhancedPreview && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {enhancedPreview.aiInsights.complexity}
                </div>
                <div className="text-sm text-muted-foreground">Complexity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {enhancedPreview.structuredView.metadata.wordCount}
                </div>
                <div className="text-sm text-muted-foreground">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {enhancedPreview.structuredView.metadata.readingTime}m
                </div>
                <div className="text-sm text-muted-foreground">Read Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {enhancedPreview.structuredView.metadata.conceptCount}
                </div>
                <div className="text-sm text-muted-foreground">Concepts</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Suggestions</h4>
              <ul className="space-y-1">
                {enhancedPreview.aiInsights.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <Sparkles className="w-3 h-3 mr-2 mt-1 text-purple-500 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Content */}
      {enhancedPreview && (
        <Card>
          <CardContent className="p-6">
            {previewMode === 'structured' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Structured Hierarchy
                </h3>
                <div className="space-y-3">
                  {enhancedPreview.structuredView.hierarchy.map((item: any, index: number) => (
                    <div 
                      key={index} 
                      className={`pl-${(item.level - 1) * 4} border-l-2 border-gray-200 dark:border-gray-700`}
                    >
                      <div className={`${item.level === 1 ? 'text-xl font-bold' : item.level === 2 ? 'text-lg font-semibold' : 'text-base font-medium'} text-gray-900 dark:text-white`}>
                        {item.title}
                      </div>
                      {item.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.content}
                        </p>
                      )}
                      {item.points && (
                        <ul className="mt-2 space-y-1">
                          {item.points.map((point: string, pIndex: number) => (
                            <li key={pIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewMode === 'formatted' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Formatted Document
                </h3>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: enhancedPreview.formattedView.htmlContent 
                  }}
                  style={{
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            )}

            {previewMode === 'interactive' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interactive Content
                </h3>
                
                {/* Interactive Concepts */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Key Concepts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {enhancedPreview.interactiveView.concepts.map((concept: any) => (
                      <div 
                        key={concept.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                      >
                        <h5 className="font-medium text-blue-900 dark:text-blue-300">
                          {concept.title}
                        </h5>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          {concept.definition?.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Sections */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Summary Sections</h4>
                  <div className="space-y-2">
                    {enhancedPreview.interactiveView.sections.map((section: any) => (
                      <details 
                        key={section.id}
                        className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">
                          {section.title}
                        </summary>
                        <ul className="mt-3 space-y-2">
                          {section.points.map((point: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isGeneratingPreview && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Generating AI Preview
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyzing content structure and generating enhanced preview...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}