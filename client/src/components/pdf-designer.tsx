import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaintbrushVertical, Eye, Download, Palette, Type, Layout, Sparkles } from "lucide-react";
import type { ProcessedNote } from "@shared/schema";

interface PDFDesignerProps {
  note: ProcessedNote | null;
  onGeneratePDF: (options: any) => void;
  isGenerating: boolean;
}

export function PDFDesigner({ note, onGeneratePDF, isGenerating }: PDFDesignerProps) {
  const [designOptions, setDesignOptions] = useState({
    style: 'modern' as 'academic' | 'modern' | 'minimal' | 'colorful',
    colorScheme: 'blue',
    fontSize: [12],
    spacing: [1.5],
    includeVisualElements: true,
    useEnhancedLayout: true,
    includeHeader: true,
    includeFooter: true,
    pageBreaks: 'auto' as 'auto' | 'manual' | 'section',
    margins: [60],
    showPreview: true
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
      useEnhancedLayout: designOptions.useEnhancedLayout,
      fontSize: designOptions.fontSize[0],
      spacing: designOptions.spacing[0],
      includeHeader: designOptions.includeHeader,
      includeFooter: designOptions.includeFooter,
      pageBreaks: designOptions.pageBreaks,
      margins: designOptions.margins[0]
    });
  };

  if (!note) {
    return (
      <div className="text-center py-12">
        <PaintbrushVertical className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          PDF Designer
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload content and generate notes to access the PDF designer.
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
            PDF Designer
          </h2>
          <p className="text-muted-foreground mt-1">
            Customize your PDF layout, colors, and styling with AI enhancement
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          AI-Enhanced
        </Badge>
      </div>

      <Tabs defaultValue="design" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="design" className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center">
            <Layout className="w-4 h-4 mr-2" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-6">
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
                Color Scheme
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
              
              <div className="p-4 rounded-lg border" style={{ backgroundColor: currentScheme.accent }}>
                <h4 className="font-semibold mb-2" style={{ color: currentScheme.primary }}>
                  Preview: {designOptions.colorScheme.charAt(0).toUpperCase() + designOptions.colorScheme.slice(1)} Theme
                </h4>
                <p className="text-sm" style={{ color: currentScheme.secondary }}>
                  This is how your PDF will look with the selected color scheme.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Type className="w-5 h-5 mr-2 text-orange-600" />
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
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
              </div>
            </CardContent>
          </Card>

          {/* AI Enhancement Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                AI Enhancement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Enhanced Layout</h4>
                  <p className="text-sm text-muted-foreground">Use AI to optimize content layout and structure</p>
                </div>
                <Switch
                  checked={designOptions.useEnhancedLayout}
                  onCheckedChange={(checked) => handleOptionChange('useEnhancedLayout', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Visual Elements</h4>
                  <p className="text-sm text-muted-foreground">Include charts, diagrams, and visual enhancements</p>
                </div>
                <Switch
                  checked={designOptions.includeVisualElements}
                  onCheckedChange={(checked) => handleOptionChange('includeVisualElements', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          {/* Page Layout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Layout className="w-5 h-5 mr-2 text-blue-600" />
                Page Layout
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
                        <SelectItem value="auto">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="section">Per Section</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Margins: {designOptions.margins[0]}pt
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
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Eye className="w-5 h-5 mr-2 text-green-600" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="w-full max-w-2xl mx-auto border rounded-lg p-6 bg-white dark:bg-gray-900"
                style={{ 
                  fontFamily: 'system-ui',
                  fontSize: `${designOptions.fontSize[0]}px`,
                  lineHeight: designOptions.spacing[0],
                  margin: `${designOptions.margins[0]/2}px`
                }}
              >
                {/* Preview Header */}
                {designOptions.includeHeader && (
                  <div 
                    className="border-b pb-4 mb-6"
                    style={{ borderColor: currentScheme.accent }}
                  >
                    <h1 
                      className="text-2xl font-bold"
                      style={{ color: currentScheme.primary }}
                    >
                      {note.title}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: currentScheme.secondary }}>
                      AI-Enhanced Study Notes
                    </p>
                  </div>
                )}

                {/* Preview Content */}
                <div className="space-y-4">
                  {note.keyConcepts && note.keyConcepts.length > 0 && (
                    <div>
                      <h2 
                        className="text-lg font-semibold mb-3"
                        style={{ color: currentScheme.primary }}
                      >
                        Key Concepts
                      </h2>
                      {note.keyConcepts.slice(0, 2).map((concept, index) => (
                        <div key={index} className="mb-3">
                          <h3 
                            className="font-medium"
                            style={{ color: currentScheme.secondary }}
                          >
                            {concept.title}
                          </h3>
                          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                            {concept.definition?.substring(0, 100)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview Footer */}
                {designOptions.includeFooter && (
                  <div 
                    className="border-t pt-4 mt-6 text-xs text-center"
                    style={{ 
                      borderColor: currentScheme.accent,
                      color: currentScheme.secondary 
                    }}
                  >
                    Generated with AI-Enhanced Processing | Page 1
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <Card>
        <CardContent className="p-6">
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating AI-Enhanced PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Generate AI-Enhanced PDF
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            PDF will be generated using multiple AI models for optimal design and layout
          </p>
        </CardContent>
      </Card>
    </div>
  );
}