import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, Download, RefreshCw, BarChart3, PieChart as PieChartIcon, Workflow, Table } from "lucide-react";

interface VisualPreviewProps {
  noteId: number;
  processedContent: any;
  pdfOptions: any;
}

export function VisualPreview({ noteId, processedContent, pdfOptions }: VisualPreviewProps) {
  const [visualData, setVisualData] = useState<any>(null);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [previewMode, setPreviewMode] = useState<'charts' | 'infographic' | 'table' | 'pdf'>('charts');

  useEffect(() => {
    if (processedContent) {
      generateVisualElements();
    }
  }, [processedContent, pdfOptions]);

  const generateVisualElements = async () => {
    setIsGeneratingVisuals(true);
    try {
      // Generate charts data from processed content
      const charts = generateChartsFromContent(processedContent);
      const infographic = generateInfographicLayout(processedContent, pdfOptions.designStyle);
      const table = generateTableData(processedContent);
      
      setVisualData({ charts, infographic, table });
    } catch (error) {
      console.error('Error generating visual elements:', error);
    } finally {
      setIsGeneratingVisuals(false);
    }
  };

  const generateChartsFromContent = (content: any) => {
    const charts = [];

    // Pie chart for key concepts
    if (content.keyConcepts && content.keyConcepts.length > 0) {
      const pieData = content.keyConcepts.map((concept: any, index: number) => ({
        name: concept.title.length > 15 ? concept.title.substring(0, 15) + '...' : concept.title,
        value: Math.max(concept.definition.length / 10, 10),
        fill: `hsl(${index * 60}, 70%, 50%)`
      }));
      
      charts.push({
        id: 'concepts-pie',
        type: 'pie',
        title: 'Key Concepts Distribution',
        data: pieData,
        component: (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      });
    }

    // Bar chart for summary points
    if (content.summaryPoints && content.summaryPoints.length > 0) {
      const barData = content.summaryPoints.map((section: any, index: number) => ({
        name: section.heading.length > 20 ? section.heading.substring(0, 20) + '...' : section.heading,
        points: section.points.length,
        fill: `hsl(${index * 45 + 180}, 60%, 50%)`
      }));

      charts.push({
        id: 'summary-bar',
        type: 'bar',
        title: 'Summary Points Analysis',
        data: barData,
        component: (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="points" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )
      });
    }

    return charts;
  };

  const generateInfographicLayout = (content: any, style: string) => {
    const colorSchemes = {
      modern: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b'],
      academic: ['#1f2937', '#374151', '#4b5563', '#6b7280'],
      colorful: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      minimal: ['#000000', '#404040', '#808080', '#c0c0c0']
    };

    return {
      style,
      colors: colorSchemes[style as keyof typeof colorSchemes] || colorSchemes.modern,
      sections: [
        { type: 'header', content: content.title },
        { type: 'concepts', content: content.keyConcepts?.slice(0, 6) || [] },
        { type: 'summary', content: content.summaryPoints?.slice(0, 4) || [] },
        { type: 'process', content: content.processFlow || [] }
      ]
    };
  };

  const generateTableData = (content: any) => {
    return {
      headers: ['Concept', 'Definition', 'Category'],
      rows: content.keyConcepts?.map((concept: any, index: number) => [
        concept.title,
        concept.definition.substring(0, 80) + (concept.definition.length > 80 ? '...' : ''),
        `Category ${Math.ceil((index + 1) / 2)}`
      ]) || []
    };
  };

  const handleGeneratePDFWithVisuals = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}/generate-visual-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pdfOptions,
          includeCharts: true,
          includeInfographic: true,
          visualElements: visualData
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `note-${noteId}-visual-enhanced.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating visual PDF:', error);
    }
  };

  if (!visualData || isGeneratingVisuals) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-lg font-medium">Generating Visual Elements...</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {['Charts', 'Infographics', 'Tables', 'Diagrams'].map((item, index) => (
              <div key={item} className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            Multi-Model AI Processing
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Visual AI Preview
              <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                Real-time Generated
              </Badge>
            </div>
            <Button onClick={handleGeneratePDFWithVisuals} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Download className="w-4 h-4 mr-2" />
              Generate Visual PDF
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Preview Tabs */}
      <Tabs value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charts" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="infographic" className="flex items-center">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Infographic
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center">
            <Table className="w-4 h-4 mr-2" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center">
            <Workflow className="w-4 h-4 mr-2" />
            PDF Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visualData.charts.map((chart: any) => (
              <Card key={chart.id} className="p-4">
                <CardHeader>
                  <CardTitle className="text-lg">{chart.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {chart.component}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infographic" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Header Section */}
              <div 
                className="p-6 rounded-lg text-white text-center"
                style={{ backgroundColor: visualData.infographic.colors[0] }}
              >
                <h1 className="text-2xl font-bold">{processedContent.title}</h1>
                <p className="text-sm opacity-90 mt-2">
                  Generated: {new Date().toLocaleDateString()} • Style: {visualData.infographic.style}
                </p>
              </div>

              {/* Concepts Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {processedContent.keyConcepts?.slice(0, 6).map((concept: any, index: number) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg text-white"
                    style={{ backgroundColor: visualData.infographic.colors[index % visualData.infographic.colors.length] }}
                  >
                    <h3 className="font-semibold text-sm mb-2">{concept.title}</h3>
                    <p className="text-xs opacity-90">
                      {concept.definition.substring(0, 80)}...
                    </p>
                  </div>
                ))}
              </div>

              {/* Process Flow */}
              {processedContent.processFlow && (
                <div className="flex flex-wrap gap-4 justify-center">
                  {processedContent.processFlow.map((step: any, index: number) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: visualData.infographic.colors[2] }}
                      >
                        {step.step}
                      </div>
                      <div className="ml-3 mr-6">
                        <div className="font-semibold text-sm">{step.title}</div>
                        <div className="text-xs text-gray-600">{step.description.substring(0, 40)}...</div>
                      </div>
                      {index < processedContent.processFlow.length - 1 && (
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    {visualData.table.headers.map((header: string, index: number) => (
                      <th key={index} className="p-3 text-left font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visualData.table.rows.map((row: string[], rowIndex: number) => (
                    <tr 
                      key={rowIndex} 
                      className={rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                    >
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="p-3 border-b border-gray-200 dark:border-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4">
          <Card className="p-6">
            <div className="bg-white shadow-lg rounded-lg p-8 mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm' }}>
              {/* PDF Preview Simulation */}
              <div className="space-y-8">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{processedContent.title}</h1>
                  <p className="text-gray-600 mt-2">
                    Generated by NoteGPT AI • Multi-Model Enhanced • {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Content Preview */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">Key Concepts</h2>
                    {processedContent.keyConcepts?.slice(0, 3).map((concept: any, index: number) => (
                      <div key={index} className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-sm">{concept.title}</h3>
                        <p className="text-xs text-gray-700 mt-1">
                          {concept.definition.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-green-600">Visual Elements</h2>
                    <div className="space-y-3">
                      <div className="h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <PieChartIcon className="w-8 h-8 text-blue-600" />
                        <span className="ml-2 text-sm font-medium">Concepts Chart</span>
                      </div>
                      <div className="h-24 bg-gradient-to-r from-green-100 to-yellow-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-green-600" />
                        <span className="ml-2 text-sm font-medium">Summary Analysis</span>
                      </div>
                      <div className="h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                        <Workflow className="w-8 h-8 text-purple-600" />
                        <span className="ml-2 text-sm font-medium">Process Flow</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 border-t pt-4">
                  AI Models Used: Gemini 2.5-Flash • Mixtral-8x7B • BERT Enhanced • LayoutLM • Visual AI
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}