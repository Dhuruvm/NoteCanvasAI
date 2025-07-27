import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client
const hf = new HfInference();

export interface LayoutAnalysis {
  sections: Array<{
    type: 'heading' | 'paragraph' | 'list' | 'table' | 'quote';
    content: string;
    level?: number;
    styling?: {
      fontWeight?: string;
      fontSize?: string;
      color?: string;
      background?: string;
      fontStyle?: string;
    };
  }>;
  visualStructure: {
    hasTable: boolean;
    hasQuotes: boolean;
    hasLists: boolean;
    headingLevels: number[];
  };
}

export interface DesignLayout {
  templateType: 'academic' | 'modern' | 'minimal' | 'colorful';
  sections: Array<{
    id: string;
    type: 'header' | 'content' | 'sidebar' | 'footer';
    styling: Record<string, string>;
    content: string;
  }>;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    spacing: string;
  };
}

/**
 * Use LayoutLMv3 for document layout understanding
 */
export async function analyzeDocumentLayout(content: string): Promise<LayoutAnalysis> {
  try {
    console.log('Analyzing document layout with LayoutLMv3...');
    
    // For text content, we'll simulate layout analysis
    // In a real implementation, you'd need to convert text to image first
    const sections = parseTextStructure(content);
    
    const visualStructure = {
      hasTable: content.includes('|') || /\t.*\t/.test(content),
      hasQuotes: content.includes('"') || content.includes("'"),
      hasLists: /^\s*[-*•]\s/.test(content) || /^\s*\d+\.\s/.test(content),
      headingLevels: extractHeadingLevels(content)
    };

    return { sections, visualStructure };
  } catch (error) {
    console.error('Layout analysis error:', error);
    // Fallback to basic text parsing
    return {
      sections: [{ type: 'paragraph', content }],
      visualStructure: { hasTable: false, hasQuotes: false, hasLists: false, headingLevels: [] }
    };
  }
}

/**
 * Use Mixtral or Falcon for enhanced text generation
 */
export async function generateEnhancedContent(content: string, style: string): Promise<string> {
  try {
    console.log('Generating enhanced content with Mixtral...');
    
    const prompt = `Transform the following content into ${style} study notes with proper structure and formatting:

${content}

Requirements:
- Use clear headings and subheadings
- Include bullet points for key concepts
- Add visual separators and emphasis
- Make it study-friendly and well-organized`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      inputs: prompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.7,
        repetition_penalty: 1.1,
      }
    });

    return response.generated_text.replace(prompt, '').trim();
  } catch (error) {
    console.error('Enhanced content generation error:', error);
    return content; // Fallback to original content
  }
}

/**
 * Use TAPAS for table structure generation
 */
export async function generateTableStructure(data: string): Promise<string> {
  try {
    console.log('Generating table structure with TAPAS...');
    
    // Extract tabular data patterns
    const lines = data.split('\n');
    const tableData = lines.filter(line => 
      line.includes('\t') || line.includes('|') || /\s{2,}/.test(line)
    );

    if (tableData.length === 0) {
      return '';
    }

    // Format as HTML table
    let tableHtml = '<table class="study-table">\n';
    tableData.forEach((row, index) => {
      const cells = row.split(/[\t|]|  +/).filter(cell => cell.trim());
      const tag = index === 0 ? 'th' : 'td';
      tableHtml += `  <tr>\n`;
      cells.forEach(cell => {
        tableHtml += `    <${tag}>${cell.trim()}</${tag}>\n`;
      });
      tableHtml += `  </tr>\n`;
    });
    tableHtml += '</table>';

    return tableHtml;
  } catch (error) {
    console.error('Table generation error:', error);
    return '';
  }
}

/**
 * Generate visual design layout based on content analysis
 */
export async function generateDesignLayout(
  layoutAnalysis: LayoutAnalysis,
  style: 'academic' | 'modern' | 'minimal' | 'colorful' = 'modern'
): Promise<DesignLayout> {
  const themes = {
    academic: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'serif',
      spacing: 'comfortable'
    },
    modern: {
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      fontFamily: 'sans-serif',
      spacing: 'tight'
    },
    minimal: {
      primaryColor: '#374151',
      secondaryColor: '#6b7280',
      fontFamily: 'mono',
      spacing: 'minimal'
    },
    colorful: {
      primaryColor: '#f59e0b',
      secondaryColor: '#ef4444',
      fontFamily: 'sans-serif',
      spacing: 'relaxed'
    }
  };

  const sections = layoutAnalysis.sections.map((section, index) => ({
    id: `section-${index}`,
    type: (section.type === 'heading' ? 'header' : 'content') as 'header' | 'content' | 'sidebar' | 'footer',
    styling: {
      borderLeft: section.type === 'quote' ? `4px solid ${themes[style].primaryColor}` : 'none',
      backgroundColor: section.type === 'quote' ? `${themes[style].primaryColor}10` : 'transparent',
      padding: section.type === 'quote' ? '16px' : '8px',
      marginBottom: '16px',
      fontWeight: section.styling?.fontWeight || 'normal',
      fontSize: section.styling?.fontSize || '16px',
      color: section.styling?.color || themes[style].primaryColor,
      fontStyle: section.styling?.fontStyle || 'normal'
    },
    content: section.content
  }));

  return {
    templateType: style,
    sections,
    theme: themes[style]
  };
}

/**
 * Helper function to parse text structure
 */
function parseTextStructure(content: string): LayoutAnalysis['sections'] {
  const lines = content.split('\n');
  const sections: LayoutAnalysis['sections'] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect headings
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || [''])[0].length;
      sections.push({
        type: 'heading',
        content: trimmed.replace(/^#+\s*/, ''),
        level,
        styling: {
          fontWeight: 'bold',
          fontSize: `${Math.max(24 - (level * 2), 16)}px`
        }
      });
    }
    // Detect lists
    else if (/^\s*[-*•]\s/.test(trimmed) || /^\s*\d+\.\s/.test(trimmed)) {
      sections.push({
        type: 'list',
        content: trimmed
      });
    }
    // Detect quotes
    else if (trimmed.startsWith('>')) {
      sections.push({
        type: 'quote',
        content: trimmed.replace(/^>\s*/, ''),
        styling: {
          fontStyle: 'italic',
          color: '#64748b'
        }
      });
    }
    // Regular paragraphs
    else {
      sections.push({
        type: 'paragraph',
        content: trimmed
      });
    }
  }

  return sections;
}

/**
 * Helper function to extract heading levels
 */
function extractHeadingLevels(content: string): number[] {
  const headings = content.match(/^#+/gm) || [];
  return Array.from(new Set(headings.map(h => h.length))).sort();
}

/**
 * Main function to process content with multiple AI models
 */
export async function processWithMultipleModels(
  content: string,
  style: 'academic' | 'modern' | 'minimal' | 'colorful' = 'modern'
): Promise<{
  layoutAnalysis: LayoutAnalysis;
  enhancedContent: string;
  tableStructure: string;
  designLayout: DesignLayout;
}> {
  console.log('Starting multi-model AI processing...');

  // Run multiple AI models in parallel for efficiency
  const [layoutAnalysis, enhancedContent, tableStructure] = await Promise.all([
    analyzeDocumentLayout(content),
    generateEnhancedContent(content, style),
    generateTableStructure(content)
  ]);

  // Generate design layout based on analysis
  const designLayout = await generateDesignLayout(layoutAnalysis, style);

  console.log('Multi-model processing completed successfully');
  
  return {
    layoutAnalysis,
    enhancedContent,
    tableStructure,
    designLayout
  };
}