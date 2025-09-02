import puppeteer, { Browser, Page } from 'puppeteer';
import { Document, RenderOptions } from '@shared/template-schema';
import { HTMLRenderer } from './html-renderer';

/**
 * Enhanced PDF Generator Service using Template Engine Architecture
 * Converts HTML to PDF using Puppeteer with template-driven approach
 */
export class TemplatePDFGenerator {
  private htmlRenderer: HTMLRenderer;
  private browser: Browser | null = null;

  constructor() {
    this.htmlRenderer = new HTMLRenderer();
  }

  /**
   * Initialize Puppeteer browser (reusable instance)
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from document JSON using template engine
   */
  async generatePDF(document: Document, options: RenderOptions = { format: 'pdf' }): Promise<Buffer> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Generate HTML from document using template engine
      const html = this.htmlRenderer.render(document, { ...options, format: 'html' });

      // Set page content
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Configure PDF options based on document styles
      const pdfOptions = this.getPDFOptions(document, options);

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /**
   * Get PDF generation options based on document settings
   */
  private getPDFOptions(document: Document, options: RenderOptions): any {
    const pageSize = document.styles.pageSize || 'A4';
    
    return {
      format: pageSize,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: options.pageNumbers,
      headerTemplate: options.pageNumbers ? this.getHeaderTemplate(document) : '',
      footerTemplate: options.pageNumbers ? this.getFooterTemplate() : '',
      margin: {
        top: '20mm',
        right: '20mm', 
        bottom: '20mm',
        left: '20mm'
      }
    };
  }

  /**
   * Generate header template for PDF
   */
  private getHeaderTemplate(document: Document): string {
    return `
<div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 10mm;">
    ${document.meta.title}
</div>`;
  }

  /**
   * Generate footer template for PDF
   */
  private getFooterTemplate(): string {
    return `
<div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-bottom: 10mm;">
    <span class="pageNumber"></span> / <span class="totalPages"></span>
</div>`;
  }

  /**
   * Generate multiple format exports
   */
  async generateMultiFormat(document: Document, formats: string[]): Promise<{ [format: string]: Buffer }> {
    const results: { [format: string]: Buffer } = {};

    for (const format of formats) {
      switch (format.toLowerCase()) {
        case 'pdf':
          results.pdf = await this.generatePDF(document, { format: 'pdf' });
          break;
        case 'html':
          const html = this.htmlRenderer.render(document, { format: 'html' });
          results.html = Buffer.from(html, 'utf-8');
          break;
        default:
          console.warn(`Unsupported format: ${format}`);
      }
    }

    return results;
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Health check for PDF generation service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setContent('<html><body><h1>Test</h1></body></html>');
      await page.pdf({ format: 'A4' });
      await page.close();
      return true;
    } catch (error) {
      console.error('Template PDF Generator health check failed:', error);
      return false;
    }
  }
}