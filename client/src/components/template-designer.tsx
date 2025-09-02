import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { FileText, Download, Eye, Palette, Type, Layout } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
}

interface DocumentData {
  meta: {
    title: string;
    author: string;
    date: string;
    tags?: string[];
  };
  outline: any[];
  blocks: any[];
  styles: {
    theme: string;
    palette: string[];
    fontPair: {
      heading: string;
      body: string;
    };
    spacing: string;
    pageSize: string;
  };
}

export function TemplateDesigner() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('modern-card');
  const [documentData, setDocumentData] = useState<DocumentData>({
    meta: {
      title: 'Sample Document',
      author: 'NoteGPT User',
      date: new Date().toISOString().split('T')[0],
      tags: ['sample', 'template']
    },
    outline: [],
    blocks: [
      {
        id: 'intro',
        type: 'heading',
        level: 1,
        text: 'Introduction',
        importance: 0.9
      },
      {
        id: 'content',
        type: 'paragraph',
        text: 'This is a sample document generated using the NoteGPT Template Engine. It demonstrates the various layout algorithms and styling capabilities.',
        importance: 0.7
      },
      {
        id: 'features',
        type: 'heading',
        level: 2,
        text: 'Key Features',
        importance: 0.8
      },
      {
        id: 'feature-list',
        type: 'list',
        ordered: false,
        items: [
          'Automatic layout optimization based on content importance',
          'Multiple theme support with consistent typography',
          'Card-based layout for enhanced readability',
          'Professional PDF generation'
        ],
        importance: 0.6
      }
    ],
    styles: {
      theme: 'modern-card',
      palette: ['#0B2140', '#19E7FF', '#F6F8FA'],
      fontPair: {
        heading: 'Inter',
        body: 'Roboto'
      },
      spacing: 'normal',
      pageSize: 'A4'
    }
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load available themes
  useEffect(() => {
    fetch('/api/templates/themes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setThemes(data.themes);
        }
      })
      .catch(err => console.error('Failed to load themes:', err));
  }, []);

  // Generate preview when document data changes
  useEffect(() => {
    generatePreview();
  }, [documentData]);

  const generatePreview = async () => {
    try {
      const response = await fetch('/api/templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: documentData,
          options: {
            format: 'html',
            includeAnnotations: true,
            includeTOC: true
          }
        }),
      });

      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/templates/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: documentData,
          options: {
            format: 'pdf',
            includeAnnotations: true,
            includeTOC: true,
            pageNumbers: true
          }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentData.meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    setDocumentData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        theme: themeId
      }
    }));
  };

  const updateDocumentMeta = (field: string, value: string) => {
    setDocumentData(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        [field]: value
      }
    }));
  };

  const addBlock = (type: string) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      text: type === 'heading' ? 'New Heading' : 'New content...',
      level: type === 'heading' ? 2 : undefined,
      importance: 0.5
    };

    setDocumentData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  };

  const convertText = async (text: string) => {
    try {
      const response = await fetch('/api/templates/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          title: documentData.meta.title,
          style: selectedTheme
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocumentData(data.document);
        }
      }
    } catch (error) {
      console.error('Failed to convert text:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Designer</h1>
          <p className="text-muted-foreground">Create beautiful documents with AI-powered templates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePreview} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Refresh Preview
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Document Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={documentData.meta.title}
                  onChange={(e) => updateDocumentMeta('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={documentData.meta.author}
                  onChange={(e) => updateDocumentMeta('author', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Theme Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTheme} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      <div>
                        <div className="font-medium">{theme.name}</div>
                        <div className="text-sm text-muted-foreground">{theme.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layout className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => addBlock('heading')}
              >
                Add Heading
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => addBlock('paragraph')}
              >
                Add Paragraph
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => addBlock('list')}
              >
                Add List
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Text Import</CardTitle>
              <CardDescription>Paste text to automatically convert to structured document</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your text here..."
                className="min-h-[100px]"
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    convertText(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your document will look with the selected theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white min-h-[600px] overflow-auto">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[600px] border-0"
                    title="Document Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                    Loading preview...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Document Structure</CardTitle>
          <CardDescription>
            Current blocks: {documentData.blocks.length} | 
            Theme: <Badge variant="secondary">{selectedTheme}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documentData.blocks.map((block, index) => (
              <div key={block.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{block.type}</Badge>
                  <span className="text-sm">{block.text?.substring(0, 50)}...</span>
                </div>
                <Badge variant="secondary">
                  Importance: {Math.round(block.importance * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}