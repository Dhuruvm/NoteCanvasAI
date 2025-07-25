import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaintbrushVertical, Eye, Download, Palette, Type, Layout, Sparkles, BarChart3, FileText } from "lucide-react";
import type { ProcessedNote } from "@shared/schema";

interface PDFDesignerProps {
  note: ProcessedNote | null;
  onGeneratePDF: (options: any) => void;
  isGenerating: boolean;
}

export function PDFDesignerEnhanced({ note, onGeneratePDF, isGenerating }: PDFDesignerProps) {
  const [designOptions, setDesignOptions] = useState({
    style: 'modern' as 'academic' | 'modern' | 'minimal' | 'colorful',
    colorScheme: 'blue',
    fontSize: [12],
    spacing: [1.5],
    includeVisualElements: true,
    includeCharts: true,
    includeInfographic: true,
    useEnhancedLayout: true,
    includeHeader: true,
    includeFooter: true,
    pageBreaks: 'auto' as 'auto' | 'manual' | 'section',
    margins: [60],
    showPreview: true,
    multiModelProcessing: true,
    fontFamily: 'helvetica' as 'helvetica' | 'times' | 'courier'
  });

  const colorSchemes = {
    blue: { primary: '#2563eb', secondary: '#64748b', accent: '#dbeafe' },
    green: { primary: '#16a34a', secondary: '#65a30d', accent: '#dcfce7' },
    purple: { primary: '#7c3aed', secondary: '#a855f7', accent: '#ede9fe' },
    orange: { primary: '#ea580c', secondary: '#f97316', accent: '#fed7aa' },
    red: { primary: '#dc2626', secondary: '#ef4444', accent: '#fecaca' },
    gray: { primary: '#374151', secondary: '#6b7280', accent: '#f3f4f6' }
  };

  const designStyles = {
    academic: { name: 'Academic', desc: 'Traditional academic paper style with formal typography' },
    modern: { name: 'Modern', desc: 'Clean, contemporary design with visual elements' },
    minimal: { name: 'Minimal', desc: 'Simple, distraction-free layout focused on content' },
    colorful: { name: 'Colorful', desc: 'Vibrant design with rich colors and graphics' }
  };

  const handleOptionChange = (key: string, value: any) => {
    setDesignOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleGeneratePDF = () => {
    onGeneratePDF({
      designStyle: designOptions.style,
      colorScheme: designOptions.colorScheme,
      includeVisualElements: designOptions.includeVisualElements,
      includeCharts: designOptions.includeCharts,
      includeInfographic: designOptions.includeInfographic,
      useEnhancedLayout: designOptions.useEnhancedLayout,
      fontSize: designOptions.fontSize[0],
      fontFamily: designOptions.fontFamily,
      spacing: designOptions.spacing[0],
      includeHeader: designOptions.includeHeader,
      includeFooter: designOptions.includeFooter,
      pageBreaks: designOptions.pageBreaks,
      margins: designOptions.margins[0],
      multiModelProcessing: designOptions.multiModelProcessing,
      pageMargins: {
        top: designOptions.margins[0],
        right: designOptions.margins[0],
        bottom: designOptions.margins[0],
        left: designOptions.margins[0]
      }
    });
  };

  if (!note) {
    return (
      <div className="text-center py-12">
        <PaintbrushVertical className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Enhanced PDF Designer
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload content and generate notes to access the multi-model PDF designer.
        </p>
      </div>
    );
  }

  const currentScheme = colorSchemes[designOptions.colorScheme as keyof typeof colorSchemes];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <PaintbrushVertical className="w-6 h-6 mr-2 text-blue-600" />
            Enhanced PDF Designer
          </h2>
          <p className="text-muted-foreground mt-1">
            Multi-model AI-powered PDF generation with visual elements and smart layout
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          Multi-Model AI
        </Badge>
      </div>

      <Tabs defaultValue="design" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="design" className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Design & AI
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center">
            <Layout className="w-4 h-4 mr-2" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Real-time Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-6">
          {/* Multi-Model AI Processing */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Multi-Model AI Processing
                <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  Advanced
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Enable Multi-Model Processing</h4>
                  <p className="text-sm text-muted-foreground">Use 6 specialized AI models for enhanced content analysis and design</p>
                </div>
                <Switch
                  checked={designOptions.multiModelProcessing}
                  onCheckedChange={(checked) => handleOptionChange('multiModelProcessing', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Generate Charts & Visualizations</h4>
                  <p className="text-sm text-muted-foreground">Auto-generate pie charts, bar charts, and flow diagrams</p>
                </div>
                <Switch
                  checked={designOptions.includeCharts}
                  onCheckedChange={(checked) => handleOptionChange('includeCharts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Create Infographic Layout</h4>
                  <p className="text-sm text-muted-foreground">Generate visual infographic layouts with AI-optimized design</p>
                </div>
                <Switch
                  checked={designOptions.includeInfographic}
                  onCheckedChange={(checked) => handleOptionChange('includeInfographic', checked)}
                />
              </div>

              {designOptions.multiModelProcessing && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <h5 className="font-medium mb-3">Active AI Models:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { name: 'Gemini 2.5-Flash', desc: 'Content Analysis', color: 'bg-blue-500' },
                      { name: 'Visual AI Generator', desc: 'Chart Creation', color: 'bg-green-500' },
                      { name: 'Layout Optimizer', desc: 'Design Layout', color: 'bg-purple-500' },
                      { name: 'Font AI', desc: 'Typography', color: 'bg-orange-500' },
                      { name: 'Color AI', desc: 'Color Schemes', color: 'bg-pink-500' },
                      { name: 'Structure AI', desc: 'Content Flow', color: 'bg-cyan-500' }
                    ].map((model, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${model.color} animate-pulse`}></div>
                        <div>
                          <div className="text-xs font-medium">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Design Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Design Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(designStyles).map(([key, style]) => (
                  <div
                    key={key}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      designOptions.style === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleOptionChange('style', key)}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white">{style.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{style.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Palette className="w-5 h-5 mr-2 text-green-600" />
                AI-Optimized Color Scheme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(colorSchemes).map(([key, scheme]) => (
                  <div
                    key={key}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all ${
                      designOptions.colorScheme === key
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : 'hover:scale-105'
                    }`}
                    onClick={() => handleOptionChange('colorScheme', key)}
                  >
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: scheme.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: scheme.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: scheme.accent }}
                      />
                    </div>
                    <p className="text-xs mt-2 capitalize font-medium">{key}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          {/* Typography & Fonts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Type className="w-5 h-5 mr-2 text-orange-600" />
                Typography & Fonts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Font Family
                    </label>
                    <Select 
                      value={designOptions.fontFamily} 
                      onValueChange={(value: any) => handleOptionChange('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="helvetica">Helvetica (Modern, Clean)</SelectItem>
                        <SelectItem value="times">Times Roman (Academic, Traditional)</SelectItem>
                        <SelectItem value="courier">Courier (Monospace, Technical)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Font Size: {designOptions.fontSize[0]}pt
                    </label>
                    <Slider
                      value={designOptions.fontSize}
                      onValueChange={(value) => handleOptionChange('fontSize', value)}
                      max={16}
                      min={8}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Line Spacing: {designOptions.spacing[0]}x
                    </label>
                    <Slider
                      value={designOptions.spacing}
                      onValueChange={(value) => handleOptionChange('spacing', value)}
                      max={2.5}
                      min={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Page Margins: {designOptions.margins[0]}pt
                    </label>
                    <Slider
                      value={designOptions.margins}
                      onValueChange={(value) => handleOptionChange('margins', value)}
                      max={100}
                      min={20}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Page Layout Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Layout className="w-5 h-5 mr-2 text-blue-600" />
                Page Layout Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Include Header</label>
                    <Switch
                      checked={designOptions.includeHeader}
                      onCheckedChange={(checked) => handleOptionChange('includeHeader', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Include Footer</label>
                    <Switch
                      checked={designOptions.includeFooter}
                      onCheckedChange={(checked) => handleOptionChange('includeFooter', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enhanced Layout</label>
                    <Switch
                      checked={designOptions.useEnhancedLayout}
                      onCheckedChange={(checked) => handleOptionChange('useEnhancedLayout', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Page Breaks
                    </label>
                    <Select 
                      value={designOptions.pageBreaks} 
                      onValueChange={(value) => handleOptionChange('pageBreaks', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatic (AI-Optimized)</SelectItem>
                        <SelectItem value="manual">Manual Control</SelectItem>
                        <SelectItem value="section">Per Section</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {/* Real-time PDF Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Eye className="w-5 h-5 mr-2 text-green-600" />
                Real-time PDF Preview
                <Badge className="ml-2 bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="w-full max-w-3xl mx-auto border rounded-lg p-8 bg-white dark:bg-gray-900 shadow-lg"
                style={{ 
                  fontFamily: designOptions.fontFamily === 'times' ? 'serif' : 
                             designOptions.fontFamily === 'courier' ? 'monospace' : 'sans-serif',
                  fontSize: `${designOptions.fontSize[0]}px`,
                  lineHeight: designOptions.spacing[0],
                  margin: `${designOptions.margins[0]/4}px`
                }}
              >
                {/* Preview Header */}
                {designOptions.includeHeader && (
                  <div 
                    className="border-b pb-4 mb-6"
                    style={{ borderColor: currentScheme.primary }}
                  >
                    <h1 
                      className="text-3xl font-bold"
                      style={{ color: currentScheme.primary }}
                    >
                      {note.title}
                    </h1>
                    <p 
                      className="text-sm mt-2"
                      style={{ color: currentScheme.secondary }}
                    >
                      Generated: {new Date().toLocaleDateString()} • Multi-Model AI Enhanced
                    </p>
                    {designOptions.multiModelProcessing && (
                      <div className="flex items-center mt-2">
                        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">
                          6 AI Models Active
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Preview */}
                <div className="space-y-6">
                  <div>
                    <h2 
                      className="text-xl font-semibold mb-4"
                      style={{ color: currentScheme.primary }}
                    >
                      Key Concepts
                    </h2>
                    {note.keyConcepts?.slice(0, 3).map((concept, index) => (
                      <div key={index} className="mb-4 p-3 rounded-lg" style={{ backgroundColor: currentScheme.accent }}>
                        <h3 className="font-medium mb-1" style={{ color: currentScheme.primary }}>
                          {index + 1}. {concept.title}
                        </h3>
                        <p className="text-sm" style={{ color: currentScheme.secondary }}>
                          {concept.definition.substring(0, 120)}...
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Visual Elements Preview */}
                  {designOptions.includeVisualElements && (
                    <div 
                      className="p-4 rounded-lg border-2 border-dashed"
                      style={{ borderColor: currentScheme.secondary, backgroundColor: currentScheme.accent }}
                    >
                      <h3 
                        className="font-medium mb-3"
                        style={{ color: currentScheme.primary }}
                      >
                        📊 Visual Elements Included
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {designOptions.includeCharts && (
                          <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded">
                            <BarChart3 className="w-4 h-4" style={{ color: currentScheme.primary }} />
                            <span>Charts & Graphs</span>
                          </div>
                        )}
                        {designOptions.includeInfographic && (
                          <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded">
                            <Layout className="w-4 h-4" style={{ color: currentScheme.primary }} />
                            <span>Infographic</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded">
                          <FileText className="w-4 h-4" style={{ color: currentScheme.primary }} />
                          <span>Enhanced Tables</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Points Preview */}
                  {note.summaryPoints && note.summaryPoints.length > 0 && (
                    <div>
                      <h2 
                        className="text-xl font-semibold mb-4"
                        style={{ color: currentScheme.primary }}
                      >
                        Summary Points
                      </h2>
                      {note.summaryPoints.slice(0, 2).map((section, index) => (
                        <div key={index} className="mb-4">
                          <h3 className="font-medium mb-2" style={{ color: currentScheme.secondary }}>
                            {section.heading}
                          </h3>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {section.points.slice(0, 3).map((point, pointIndex) => (
                              <li key={pointIndex} className="text-gray-700 dark:text-gray-300">
                                {point.substring(0, 80)}...
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview Footer */}
                {designOptions.includeFooter && (
                  <div 
                    className="border-t pt-4 mt-8 text-xs"
                    style={{ borderColor: currentScheme.primary, color: currentScheme.secondary }}
                  >
                    <div className="flex justify-between items-center">
                      <span>Page 1 of 3 • Generated by NoteGPT AI</span>
                      <span>
                        {designOptions.multiModelProcessing ? '6 AI Models Used' : 'Standard Processing'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Generate Button */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="p-6">
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-4"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Enhanced PDF with {designOptions.multiModelProcessing ? '6' : '1'} AI Models...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-3" />
                Generate {designOptions.multiModelProcessing ? 'Multi-Model' : 'Standard'} AI-Enhanced PDF
              </>
            )}
          </Button>
          
          <div className="mt-4 text-center space-y-2">
            <div className="flex items-center justify-center flex-wrap gap-2 text-sm text-muted-foreground">
              <span>PDF will include:</span>
              <Badge variant="outline">{designOptions.includeVisualElements ? 'Visual Elements' : 'Text Only'}</Badge>
              {designOptions.includeCharts && <Badge variant="outline">Charts</Badge>}
              {designOptions.includeInfographic && <Badge variant="outline">Infographic</Badge>}
              <Badge variant="outline">{designOptions.multiModelProcessing ? 'Multi-Model AI' : 'Standard AI'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated generation time: {designOptions.multiModelProcessing ? '20-45' : '5-10'} seconds
            </p>
            <p className="text-xs text-muted-foreground">
              Font: {designOptions.fontFamily} • Size: {designOptions.fontSize[0]}pt • 
              Style: {designStyles[designOptions.style].name} • 
              Colors: {designOptions.colorScheme}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}