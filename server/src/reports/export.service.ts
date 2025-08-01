import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { AppError, ErrorCode } from '../errors/error-codes';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  filename?: string;
  title?: string;
  includeCharts?: boolean;
}

@Injectable()
export class ExportService {
  
  async exportReport(data: any, options: ExportOptions, res: Response): Promise<void> {
    try {
      const filename = options.filename || `report_${new Date().toISOString().split('T')[0]}`;
      
      switch (options.format) {
        case 'csv':
          await this.exportToCSV(data, filename, res);
          break;
        case 'excel':
          await this.exportToExcel(data, filename, res);
          break;
        case 'pdf':
          await this.exportToPDF(data, filename, options.title || 'Report', res);
          break;
        default:
          throw new AppError(
            ErrorCode.VALIDATION,
            `Unsupported export format: ${options.format}`
          );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.UNKNOWN,
        'Failed to export report'
      );
    }
  }

  private async exportToCSV(data: any[], filename: string, res: Response): Promise<void> {
    if (!Array.isArray(data) || data.length === 0) {
      throw new AppError(
        ErrorCode.VALIDATION,
        'No data available to export'
      );
    }

    try {
      // Get headers from the first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value !== null && value !== undefined ? value : '';
        });
        csvContent += values.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvContent);
    } catch (error) {
      throw new AppError(
        ErrorCode.UNKNOWN,
        'Failed to generate CSV export'
      );
    }
  }

  private async exportToExcel(data: any[], filename: string, res: Response): Promise<void> {
    // For now, we'll create a simple tab-separated format that Excel can open
    // In a production environment, you'd want to use a library like 'exceljs'
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new AppError(
        ErrorCode.VALIDATION,
        'No data available to export'
      );
    }

    try {
      const headers = Object.keys(data[0]);
      
      // Create Excel-compatible content (tab-separated)
      let excelContent = headers.join('\t') + '\n';
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return value !== null && value !== undefined ? value : '';
        });
        excelContent += values.join('\t') + '\n';
      });

      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xls"`);
      res.send(excelContent);
    } catch (error) {
      throw new AppError(
        ErrorCode.UNKNOWN,
        'Failed to generate Excel export'
      );
    }
  }

  private async exportToPDF(data: any, filename: string, title: string, res: Response): Promise<void> {
    try {
      // Create a simple HTML-to-PDF conversion
      // In production, you'd want to use libraries like 'puppeteer' or 'pdfkit'
      
      const htmlContent = this.generateHTMLReport(data, title);
      
      // For now, we'll send HTML that can be printed to PDF by the browser
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="${filename}.html"`);
      res.send(htmlContent);
    } catch (error) {
      throw new AppError(
        ErrorCode.UNKNOWN,
        'Failed to generate PDF export'
      );
    }
  }

  private generateHTMLReport(data: any, title: string): string {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #007bff; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .number { text-align: right; }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        .warning { color: #ffc107; }
        @media print { 
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    `;

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        <h1>${title}</h1>
        <div class="summary">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Report Type:</strong> ${this.getReportType(data)}</p>
        </div>
    `;

    if (Array.isArray(data)) {
      content += this.generateTableHTML(data);
    } else if (typeof data === 'object') {
      content += this.generateObjectHTML(data);
    }

    content += `
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print to PDF
          </button>
        </div>
      </body>
      </html>
    `;

    return content;
  }

  private generateTableHTML(data: any[]): string {
    if (data.length === 0) return '<p>No data available</p>';

    const headers = Object.keys(data[0]);
    
    let html = '<table><thead><tr>';
    headers.forEach(header => {
      html += `<th>${this.formatHeader(header)}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const value = row[header];
        const formattedValue = this.formatValue(value, header);
        const cssClass = this.getCSSClass(value, header);
        html += `<td class="${cssClass}">${formattedValue}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  private generateObjectHTML(data: any): string {
    let html = '';
    
    // Handle dashboard metrics format
    if (data.summary) {
      html += '<h2>Summary</h2><table>';
      Object.entries(data.summary).forEach(([key, value]) => {
        html += `<tr><td><strong>${this.formatHeader(key)}</strong></td><td class="number">${this.formatValue(value, key)}</td></tr>`;
      });
      html += '</table>';
    }

    if (data.topPerformers) {
      html += '<h2>Top Performers</h2>';
      Object.entries(data.topPerformers).forEach(([key, items]) => {
        if (Array.isArray(items) && items.length > 0) {
          html += `<h3>${this.formatHeader(key)}</h3>`;
          html += this.generateTableHTML(items.slice(0, 5));
        }
      });
    }

    if (data.alerts) {
      html += '<h2>Alerts</h2>';
      Object.entries(data.alerts).forEach(([key, items]) => {
        if (Array.isArray(items) && items.length > 0) {
          html += `<h3 class="warning">${this.formatHeader(key)} (${items.length} items)</h3>`;
          html += this.generateTableHTML(items.slice(0, 10));
        }
      });
    }

    return html;
  }

  private formatHeader(header: string): string {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return '-';
    
    // Format currency values
    if (key.includes('price') || key.includes('cost') || key.includes('revenue') || key.includes('profit') || key.includes('value')) {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value);
      }
    }
    
    // Format percentages
    if (key.includes('margin') || key.includes('percentage')) {
      if (typeof value === 'number') {
        return `${value.toFixed(2)}%`;
      }
    }
    
    // Format numbers
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    // Format dates
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value);
  }

  private getCSSClass(value: any, key: string): string {
    let classes = [];
    
    if (typeof value === 'number') {
      classes.push('number');
      
      if (key.includes('profit') || key.includes('margin')) {
        if (value > 0) classes.push('positive');
        else if (value < 0) classes.push('negative');
      }
    }
    
    return classes.join(' ');
  }

  private getReportType(data: any): string {
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const firstItem = data[0];
        if (firstItem.turnoverRatio !== undefined) return 'Inventory Turnover Report';
        if (firstItem.velocityPerDay !== undefined) return 'Stock Movement Analytics';
        if (firstItem.stockoutRisk !== undefined) return 'Low Stock Trend Analysis';
        if (firstItem.categoryName !== undefined) return 'Category Performance Report';
      }
      return 'Data Report';
    } else if (data.summary) {
      return 'Dashboard Metrics Report';
    }
    return 'Custom Report';
  }
}
