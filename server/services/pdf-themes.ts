
export interface PDFTheme {
  name: string;
  colors: {
    primary: any;
    secondary: any;
    accent: any;
    background: any;
    text: any;
    highlight: any;
  };
  typography: {
    titleFont: string;
    headingFont: string;
    bodyFont: string;
    titleSize: number;
    headingSize: number;
    bodySize: number;
  };
  layout: {
    margins: { top: number; right: number; bottom: number; left: number };
    spacing: { line: number; paragraph: number; section: number };
    columns: number;
  };
  decorations: {
    borders: boolean;
    shadows: boolean;
    gradients: boolean;
    icons: boolean;
    patterns: boolean;
  };
}

export const advancedThemes: { [key: string]: PDFTheme } = {
  'executive': {
    name: 'Executive',
    colors: {
      primary: { r: 0.1, g: 0.2, b: 0.4 },
      secondary: { r: 0.4, g: 0.5, b: 0.6 },
      accent: { r: 0.8, g: 0.9, b: 1.0 },
      background: { r: 1.0, g: 1.0, b: 1.0 },
      text: { r: 0.2, g: 0.2, b: 0.2 },
      highlight: { r: 0.2, g: 0.4, b: 0.8 }
    },
    typography: {
      titleFont: 'Times-Bold',
      headingFont: 'Times-Roman',
      bodyFont: 'Times-Roman',
      titleSize: 28,
      headingSize: 18,
      bodySize: 12
    },
    layout: {
      margins: { top: 80, right: 60, bottom: 80, left: 60 },
      spacing: { line: 1.6, paragraph: 16, section: 32 },
      columns: 1
    },
    decorations: {
      borders: true,
      shadows: true,
      gradients: true,
      icons: false,
      patterns: false
    }
  },
  'creative': {
    name: 'Creative',
    colors: {
      primary: { r: 0.8, g: 0.2, b: 0.6 },
      secondary: { r: 0.2, g: 0.8, b: 0.4 },
      accent: { r: 1.0, g: 0.8, b: 0.2 },
      background: { r: 0.98, g: 0.98, b: 1.0 },
      text: { r: 0.1, g: 0.1, b: 0.1 },
      highlight: { r: 0.9, g: 0.3, b: 0.7 }
    },
    typography: {
      titleFont: 'Helvetica-Bold',
      headingFont: 'Helvetica-Bold',
      bodyFont: 'Helvetica',
      titleSize: 32,
      headingSize: 20,
      bodySize: 13
    },
    layout: {
      margins: { top: 70, right: 50, bottom: 70, left: 50 },
      spacing: { line: 1.8, paragraph: 18, section: 36 },
      columns: 2
    },
    decorations: {
      borders: true,
      shadows: true,
      gradients: true,
      icons: true,
      patterns: true
    }
  },
  'technical': {
    name: 'Technical',
    colors: {
      primary: { r: 0.1, g: 0.3, b: 0.1 },
      secondary: { r: 0.3, g: 0.6, b: 0.3 },
      accent: { r: 0.8, g: 1.0, b: 0.8 },
      background: { r: 0.99, g: 1.0, b: 0.99 },
      text: { r: 0.1, g: 0.1, b: 0.1 },
      highlight: { r: 0.2, g: 0.7, b: 0.2 }
    },
    typography: {
      titleFont: 'Courier-Bold',
      headingFont: 'Courier-Bold',
      bodyFont: 'Courier',
      titleSize: 24,
      headingSize: 16,
      bodySize: 11
    },
    layout: {
      margins: { top: 60, right: 40, bottom: 60, left: 40 },
      spacing: { line: 1.4, paragraph: 14, section: 28 },
      columns: 1
    },
    decorations: {
      borders: false,
      shadows: false,
      gradients: false,
      icons: false,
      patterns: true
    }
  }
};

export function getAdvancedTheme(themeName: string): PDFTheme {
  return advancedThemes[themeName] || advancedThemes['executive'];
}

// Helper function moved from enhanced-pdf-generator
export function getConceptIcon(title: string): string {
  const keywords = title.toLowerCase();
  
  if (keywords.includes('process') || keywords.includes('step')) return '⚙️';
  if (keywords.includes('data') || keywords.includes('information')) return '📊';
  if (keywords.includes('theory') || keywords.includes('concept')) return '💡';
  if (keywords.includes('formula') || keywords.includes('equation')) return '📐';
  if (keywords.includes('example') || keywords.includes('case')) return '🎯';
  if (keywords.includes('result') || keywords.includes('outcome')) return '✅';
  if (keywords.includes('problem') || keywords.includes('issue')) return '⚠️';
  if (keywords.includes('solution') || keywords.includes('answer')) return '🔧';
  
  return '📋'; // Default icon
}
