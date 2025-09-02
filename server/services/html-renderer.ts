import { Document, DocumentBlock, RenderOptions } from '@shared/template-schema';
import { TemplateEngine, ProcessedBlock, TemplateData } from './template-engine';

/**
 * HTML Template Renderer - Converts JSON documents to styled HTML
 * Following the architecture's HTML → Puppeteer → PDF flow
 */
export class HTMLRenderer {
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Main render function: Document JSON → HTML
   */
  render(document: Document, options: RenderOptions = { format: 'html' }): string {
    const processedBlocks = this.templateEngine.processBlocks(document.blocks, document.styles);
    const cssVariables = this.templateEngine.generateCSSVariables(document.styles);
    const tableOfContents = options.includeTOC ? 
      this.templateEngine.generateTableOfContents(document.blocks) : [];

    const templateData: TemplateData = {
      document,
      processedBlocks,
      cssVariables,
      tableOfContents
    };

    return this.generateHTML(templateData, options);
  }

  /**
   * Generate complete HTML document
   */
  private generateHTML(data: TemplateData, options: RenderOptions): string {
    const { document, processedBlocks, cssVariables, tableOfContents } = data;
    
    return `
<!DOCTYPE html>
<html lang="${document.meta.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.meta.title}</title>
    <style>
        ${this.generateCSS(document.styles.theme, cssVariables)}
    </style>
</head>
<body class="document" data-theme="${document.styles.theme}">
    <div class="page-container">
        ${this.renderHeader(document.meta)}
        
        ${options.includeTOC && tableOfContents.length > 0 ? this.renderTableOfContents(tableOfContents) : ''}
        
        <main class="content">
            ${processedBlocks.map(block => this.renderBlock(block, options)).join('\n')}
        </main>
        
        ${this.renderFooter(document.meta)}
    </div>
</body>
</html>`;
  }

  /**
   * Generate theme-based CSS
   */
  private generateCSS(theme: string, variables: Record<string, string>): string {
    const cssVars = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ');

    return `
:root {
    ${cssVars}
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--body-font), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: var(--base-font-size);
    line-height: var(--line-height);
    color: var(--text-color);
    background-color: var(--background-color);
}

.page-container {
    max-width: 210mm; /* A4 width */
    margin: 0 auto;
    padding: 20mm;
    background: white;
    min-height: 297mm; /* A4 height */
}

.document-header {
    border-bottom: 2px solid var(--primary-color);
    margin-bottom: 2rem;
    padding-bottom: 1rem;
}

.document-title {
    font-family: var(--heading-font);
    font-size: 2.5rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.document-meta {
    color: #666;
    font-size: 0.9rem;
}

.table-of-contents {
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    margin-bottom: 2rem;
    border-left: 4px solid var(--accent-color);
}

.toc-title {
    font-family: var(--heading-font);
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.block {
    margin-bottom: 1rem;
}

.block.card {
    background: var(--background-color);
    border-radius: var(--border-radius);
    padding: 1rem;
    box-shadow: var(--shadow);
    border-left: 4px solid var(--accent-color);
}

.block-heading {
    font-family: var(--heading-font);
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.block-heading.level-1 { font-size: 2rem; }
.block-heading.level-2 { font-size: 1.6rem; }
.block-heading.level-3 { font-size: 1.3rem; }
.block-heading.level-4 { font-size: 1.1rem; }
.block-heading.level-5 { font-size: 1rem; }
.block-heading.level-6 { font-size: 0.9rem; }

.block-paragraph {
    margin-bottom: 1rem;
    text-align: justify;
}

.block-list {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
}

.block-quote {
    background: var(--background-color);
    border-left: 4px solid var(--accent-color);
    padding: 1rem 1.5rem;
    margin: 1rem 0;
    font-style: italic;
}

.block-image {
    text-align: center;
    margin: 1.5rem 0;
}

.block-image img {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
}

.image-caption {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
}

.block-table {
    overflow-x: auto;
    margin: 1rem 0;
}

.block-table table {
    width: 100%;
    border-collapse: collapse;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
}

.block-table th,
.block-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.block-table th {
    background: var(--primary-color);
    color: white;
    font-family: var(--heading-font);
}

.block-code {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: var(--border-radius);
    padding: 1rem;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
    overflow-x: auto;
    margin: 1rem 0;
}

.annotation-highlight {
    background: #fff3cd;
    padding: 0 2px;
    border-radius: 2px;
}

.annotation-note {
    background: #d1ecf1;
    padding: 0 2px;
    border-radius: 2px;
}

.document-footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
    text-align: center;
    color: #666;
    font-size: 0.8rem;
}

/* Theme-specific styles */
.document[data-theme="modern-card"] .block.card {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.document[data-theme="classic-report"] {
    font-family: 'Times New Roman', serif;
}

.document[data-theme="compact-notes"] .block {
    margin-bottom: 0.5rem;
}

.document[data-theme="academic"] .block-heading {
    text-align: center;
}

.document[data-theme="presentation"] {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

/* Print styles */
@media print {
    .page-container {
        max-width: none;
        margin: 0;
        padding: 15mm;
        background: white;
    }
    
    .block {
        break-inside: avoid;
    }
    
    .block-heading {
        break-after: avoid;
    }
}
`;
  }

  /**
   * Render document header
   */
  private renderHeader(meta: any): string {
    return `
<header class="document-header">
    <h1 class="document-title">${this.escapeHtml(meta.title)}</h1>
    <div class="document-meta">
        ${meta.author ? `<span>By ${this.escapeHtml(meta.author)}</span> • ` : ''}
        <span>${meta.date}</span>
        ${meta.tags && meta.tags.length > 0 ? ` • <span>${meta.tags.join(', ')}</span>` : ''}
    </div>
</header>`;
  }

  /**
   * Render table of contents
   */
  private renderTableOfContents(toc: DocumentBlock[]): string {
    const tocItems = toc.map(item => 
      `<div class="toc-item">${this.escapeHtml(item.text || '')}</div>`
    ).join('\n');

    return `
<section class="table-of-contents">
    <h2 class="toc-title">Table of Contents</h2>
    ${tocItems}
</section>`;
  }

  /**
   * Render individual block
   */
  private renderBlock(block: ProcessedBlock, options: RenderOptions): string {
    const blockClasses = ['block'];
    if (block.isCard) blockClasses.push('card');
    
    const blockStyle = `
        margin-top: ${block.computedStyles.marginTop}px;
        margin-bottom: ${block.computedStyles.marginBottom}px;
        background-color: ${block.computedStyles.backgroundColor};
        border-radius: ${block.computedStyles.borderRadius};
        padding: ${block.computedStyles.padding};
    `;

    let content = '';
    
    switch (block.type) {
      case 'heading':
        content = `<h${block.level || 1} class="block-heading level-${block.level || 1}" 
                     style="font-size: ${block.computedStyles.fontSize}px;">
                     ${this.processAnnotations(block.text || '', block.annotations || [], options)}
                   </h${block.level || 1}>`;
        break;
        
      case 'paragraph':
        content = `<p class="block-paragraph">
                     ${this.processAnnotations(block.text || '', block.annotations || [], options)}
                   </p>`;
        break;
        
      case 'list':
        const listTag = block.ordered ? 'ol' : 'ul';
        const listItems = (block.items || []).map(item => 
          `<li>${this.escapeHtml(item)}</li>`
        ).join('\n');
        content = `<${listTag} class="block-list">${listItems}</${listTag}>`;
        break;
        
      case 'quote':
        content = `<blockquote class="block-quote">
                     ${this.processAnnotations(block.text || '', block.annotations || [], options)}
                   </blockquote>`;
        break;
        
      case 'image':
        content = this.renderImage(block);
        break;
        
      case 'table':
        content = this.renderTable(block);
        break;
        
      case 'code':
        content = `<pre class="block-code"><code class="language-${block.language || 'text'}">
                     ${this.escapeHtml(block.text || '')}
                   </code></pre>`;
        break;
        
      case 'separator':
        content = '<hr class="block-separator">';
        break;
        
      default:
        content = `<div class="block-unknown">${this.escapeHtml(block.text || '')}</div>`;
    }

    return `<div class="${blockClasses.join(' ')}" style="${blockStyle}">${content}</div>`;
  }

  /**
   * Render image block
   */
  private renderImage(block: ProcessedBlock): string {
    const imgSrc = block.data ? `data:${block.mime};base64,${block.data}` : block.url;
    const imgAlt = block.caption || 'Image';
    
    return `
<figure class="block-image">
    <img src="${imgSrc}" alt="${this.escapeHtml(imgAlt)}" />
    ${block.caption ? `<figcaption class="image-caption">${this.escapeHtml(block.caption)}</figcaption>` : ''}
</figure>`;
  }

  /**
   * Render table block
   */
  private renderTable(block: ProcessedBlock): string {
    const headers = block.headers || [];
    const rows = block.rows || [];
    
    const headerRow = headers.length > 0 ? 
      `<tr>${headers.map(h => `<th>${this.escapeHtml(h)}</th>`).join('')}</tr>` : '';
    
    const dataRows = rows.map(row => 
      `<tr>${row.map(cell => `<td>${this.escapeHtml(cell)}</td>`).join('')}</tr>`
    ).join('\n');
    
    return `
<div class="block-table">
    <table>
        ${headerRow}
        ${dataRows}
    </table>
</div>`;
  }

  /**
   * Process annotations (highlights, notes, etc.)
   */
  private processAnnotations(text: string, annotations: any[], options: RenderOptions): string {
    if (!options.includeAnnotations || annotations.length === 0) {
      return this.escapeHtml(text);
    }

    let processedText = text;
    
    // Sort annotations by span start position (descending) to avoid offset issues
    const sortedAnnotations = [...annotations].sort((a, b) => b.span[0] - a.span[0]);
    
    for (const annotation of sortedAnnotations) {
      const [start, end] = annotation.span;
      const beforeText = processedText.substring(0, start);
      const annotatedText = processedText.substring(start, end);
      const afterText = processedText.substring(end);
      
      let wrappedText = annotatedText;
      
      switch (annotation.type) {
        case 'highlight':
          wrappedText = `<span class="annotation-highlight" style="background-color: ${annotation.color || '#fff3cd'}">${annotatedText}</span>`;
          break;
        case 'note':
          wrappedText = `<span class="annotation-note" title="${this.escapeHtml(annotation.note || '')}">${annotatedText}</span>`;
          break;
        case 'link':
          wrappedText = `<a href="${annotation.url}" target="_blank">${annotatedText}</a>`;
          break;
        case 'underline':
          wrappedText = `<u>${annotatedText}</u>`;
          break;
        case 'strikethrough':
          wrappedText = `<s>${annotatedText}</s>`;
          break;
      }
      
      processedText = beforeText + wrappedText + afterText;
    }
    
    return processedText;
  }

  /**
   * Render document footer
   */
  private renderFooter(meta: any): string {
    return `
<footer class="document-footer">
    <div>Generated by NoteGPT Template Engine</div>
    <div>Document created: ${meta.date}</div>
</footer>`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = { innerHTML: '' } as any;
    div.textContent = text;
    return div.innerHTML || text.replace(/[&<>'"]/g, (char: string) => {
      const entities: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      };
      return entities[char] || char;
    });
  }
}