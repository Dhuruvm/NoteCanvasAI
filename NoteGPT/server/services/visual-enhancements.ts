
import { rgb } from 'pdf-lib';

export interface IconElement {
  type: 'concept' | 'summary' | 'application' | 'process';
  symbol: string;
  color: any;
  size: number;
  position: { x: number; y: number };
}

export interface GradientBackground {
  type: 'linear' | 'radial' | 'pattern';
  colors: any[];
  direction: 'horizontal' | 'vertical' | 'diagonal';
  opacity: number;
}

export interface AdvancedVisualElements {
  watermarks: any[];
  borders: any[];
  shadows: any[];
  textures: any[];
  animations: any[];
}

/**
 * Generate contextual icons for different content types
 */
export async function generateIconElements(note: any): Promise<{ icons: IconElement[] }> {
  const icons: IconElement[] = [];
  
  // Generate icons based on content
  if (note.keyConcepts) {
    note.keyConcepts.forEach((concept: any, index: number) => {
      icons.push({
        type: 'concept',
        symbol: getConceptIcon(concept.title),
        color: rgb(0.2 + (index * 0.1), 0.4 + (index * 0.05), 0.8 - (index * 0.1)),
        size: 16,
        position: { x: 20, y: 600 - (index * 80) }
      });
    });
  }
  
  return { icons };
}

/**
 * Generate gradient backgrounds based on design style
 */
export async function generateGradientBackgrounds(
  designStyle: string, 
  colorScheme: string
): Promise<{ gradients: GradientBackground[] }> {
  const gradients: GradientBackground[] = [];
  
  const colorMaps = {
    blue: [rgb(0.9, 0.95, 1), rgb(0.7, 0.85, 0.98), rgb(0.5, 0.7, 0.95)],
    green: [rgb(0.9, 1, 0.95), rgb(0.7, 0.95, 0.8), rgb(0.5, 0.9, 0.7)],
    purple: [rgb(0.95, 0.9, 1), rgb(0.85, 0.7, 0.98), rgb(0.75, 0.5, 0.95)],
    orange: [rgb(1, 0.95, 0.9), rgb(0.98, 0.85, 0.7), rgb(0.95, 0.75, 0.5)]
  };
  
  const colors = colorMaps[colorScheme as keyof typeof colorMaps] || colorMaps.blue;
  
  if (designStyle === 'modern' || designStyle === 'colorful') {
    gradients.push({
      type: 'linear',
      colors: colors,
      direction: 'diagonal',
      opacity: 0.1
    });
  }
  
  return { gradients };
}

/**
 * Create advanced visual elements
 */
export async function generateAdvancedVisualElements(
  note: any,
  options: any
): Promise<AdvancedVisualElements> {
  
  return {
    watermarks: await generateWatermarks(note),
    borders: await generateDecorativeBorders(options.designStyle),
    shadows: await generateDropShadows(options.designStyle),
    textures: await generateBackgroundTextures(options.designStyle),
    animations: [] // For future interactive PDF support
  };
}

function getConceptIcon(title: string): string {
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

async function generateWatermarks(note: any): Promise<any[]> {
  return [{
    text: 'AI-Generated Notes',
    opacity: 0.05,
    rotation: -45,
    fontSize: 72,
    color: rgb(0.5, 0.5, 0.5)
  }];
}

async function generateDecorativeBorders(designStyle: string): Promise<any[]> {
  if (designStyle === 'academic') {
    return [{
      type: 'classic',
      width: 2,
      pattern: 'solid',
      corners: 'rounded'
    }];
  }
  
  if (designStyle === 'modern') {
    return [{
      type: 'minimal',
      width: 1,
      pattern: 'gradient',
      corners: 'sharp'
    }];
  }
  
  return [];
}

async function generateDropShadows(designStyle: string): Promise<any[]> {
  if (designStyle === 'colorful' || designStyle === 'modern') {
    return [{
      offset: { x: 3, y: 3 },
      blur: 5,
      opacity: 0.2,
      color: rgb(0, 0, 0)
    }];
  }
  
  return [];
}

async function generateBackgroundTextures(designStyle: string): Promise<any[]> {
  if (designStyle === 'colorful') {
    return [{
      type: 'subtle-dots',
      opacity: 0.05,
      size: 2,
      spacing: 20
    }];
  }
  
  return [];
}
