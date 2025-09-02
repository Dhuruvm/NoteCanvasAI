import { Document, DocumentBlock, LayoutConfig, DocumentStyles } from '@shared/template-schema';

/**
 * Core Template Engine - Implements the layout & styling algorithms
 * from the architecture specification
 */
export class TemplateEngine {
  private config: LayoutConfig;

  constructor(config: LayoutConfig = {
    baseFontSize: 14,
    scaleRatio: 1.25,
    lineHeight: 1.6,
    maxLineLength: 70,
    marginTop: 20,
    marginBottom: 20,
    cardThreshold: 0.7
  }) {
    this.config = config;
  }

  /**
   * 3.1 Block importance & density calculation
   */
  calculateLayoutWeight(block: DocumentBlock): number {
    const levelPenalty = block.level ? 1 / (1 + 0.5 * block.level) : 1;
    return block.importance * (1 + 0.5 * levelPenalty);
  }

  /**
   * 3.2 Heading size formula using modular scale
   */
  calculateHeadingFontSize(level: number): number {
    const { baseFontSize, scaleRatio } = this.config;
    const scalePower = Math.max(0, 4 - level);
    return baseFontSize * Math.pow(scaleRatio, scalePower);
  }

  /**
   * 3.3 Line length & measure optimization
   */
  calculateOptimalLineLength(pageWidth: number, fontSize: number): number {
    // Estimate characters per line
    const charactersPerLine = (pageWidth * 0.5) / (0.6 * fontSize);
    
    // Target 55-75 characters per line
    if (charactersPerLine < 55) {
      return Math.max(fontSize * 0.9, 12); // Reduce font size but not below 12px
    }
    if (charactersPerLine > 75) {
      return fontSize * 1.1; // Increase font size
    }
    return fontSize;
  }

  /**
   * 3.4 Color & contrast selection for accessibility
   */
  ensureAccessibleContrast(foreground: string, background: string): string {
    const luminance = (color: string): number => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const contrastRatio = (l1: number, l2: number): number => {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const fgLuminance = luminance(foreground);
    const bgLuminance = luminance(background);
    const ratio = contrastRatio(fgLuminance, bgLuminance);

    // If contrast is below 4.5:1, adjust foreground color
    if (ratio < 4.5) {
      // Simple adjustment: darken or lighten the foreground
      const adjustment = bgLuminance > 0.5 ? '#000000' : '#FFFFFF';
      return adjustment;
    }

    return foreground;
  }

  /**
   * 3.5 Cardify / Chunk-to-card mapping
   */
  shouldRenderAsCard(block: DocumentBlock): boolean {
    const layoutWeight = this.calculateLayoutWeight(block);
    return (
      layoutWeight > this.config.cardThreshold ||
      block.type === 'quote' ||
      block.type === 'image' ||
      (block.type === 'paragraph' && block.annotations && block.annotations.length > 0)
    );
  }

  /**
   * 3.6 Automatic TOC generation
   */
  generateTableOfContents(blocks: DocumentBlock[]): DocumentBlock[] {
    return blocks
      .filter(block => block.type === 'heading' && this.calculateLayoutWeight(block) > 0.5)
      .map((block, index) => ({
        id: `toc-${index}`,
        type: 'paragraph' as const,
        text: `${'  '.repeat((block.level || 1) - 1)}${block.text}`,
        importance: 0.3,
        styleHints: {
          align: 'left' as const
        }
      }));
  }

  /**
   * Enhanced block processing with layout algorithms
   */
  processBlocks(blocks: DocumentBlock[], styles: DocumentStyles): ProcessedBlock[] {
    return blocks.map(block => {
      const layoutWeight = this.calculateLayoutWeight(block);
      const isCard = this.shouldRenderAsCard(block);
      
      let fontSize = this.config.baseFontSize;
      if (block.type === 'heading' && block.level) {
        fontSize = this.calculateHeadingFontSize(block.level);
      }

      return {
        ...block,
        layoutWeight,
        isCard,
        computedStyles: {
          fontSize,
          lineHeight: this.config.lineHeight,
          marginTop: this.config.marginTop * layoutWeight,
          marginBottom: this.config.marginBottom * layoutWeight,
          backgroundColor: isCard ? this.getCardBackground(styles) : 'transparent',
          borderRadius: isCard ? '8px' : '0px',
          padding: isCard ? '16px' : '0px'
        }
      };
    });
  }

  /**
   * Get card background color based on theme
   */
  private getCardBackground(styles: DocumentStyles): string {
    const { theme, palette } = styles;
    
    switch (theme) {
      case 'modern-card':
        return palette[2] || '#F6F8FA';
      case 'classic-report':
        return '#FFFFFF';
      case 'compact-notes':
        return '#FAFAFA';
      case 'academic':
        return '#FFFFFF';
      case 'presentation':
        return palette[0] || '#0B2140';
      default:
        return '#F6F8FA';
    }
  }

  /**
   * Generate CSS variables from document styles
   */
  generateCSSVariables(styles: DocumentStyles): Record<string, string> {
    const { palette, fontPair } = styles;
    
    return {
      '--primary-color': palette[0] || '#0B2140',
      '--accent-color': palette[1] || '#19E7FF',
      '--background-color': palette[2] || '#F6F8FA',
      '--text-color': this.ensureAccessibleContrast('#333333', palette[2] || '#F6F8FA'),
      '--heading-font': fontPair.heading,
      '--body-font': fontPair.body,
      '--base-font-size': `${this.config.baseFontSize}px`,
      '--line-height': this.config.lineHeight.toString(),
      '--border-radius': '8px',
      '--shadow': '0 2px 8px rgba(0, 0, 0, 0.1)'
    };
  }
}

export interface ProcessedBlock extends DocumentBlock {
  layoutWeight: number;
  isCard: boolean;
  computedStyles: {
    fontSize: number;
    lineHeight: number;
    marginTop: number;
    marginBottom: number;
    backgroundColor: string;
    borderRadius: string;
    padding: string;
  };
}

export interface TemplateData {
  document: Document;
  processedBlocks: ProcessedBlock[];
  cssVariables: Record<string, string>;
  tableOfContents: DocumentBlock[];
}