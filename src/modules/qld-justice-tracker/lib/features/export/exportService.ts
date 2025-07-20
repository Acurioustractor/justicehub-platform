import { getSupabaseAdmin } from '@/lib/supabase/server';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export type ExportFormat = 'csv' | 'json' | 'pdf';
export type ExportTable = 'youth_statistics' | 'budget_allocations' | 'court_statistics' | 'parliamentary_documents';

export interface ExportOptions {
  format: ExportFormat;
  table: ExportTable;
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, any>;
  includeMetadata?: boolean;
}

export class ExportService {
  private supabase = getSupabaseAdmin();

  /**
   * Export data in the requested format
   */
  async exportData(options: ExportOptions): Promise<{
    data: Buffer | string;
    contentType: string;
    filename: string;
  }> {
    // Fetch data based on table and filters
    const rawData = await this.fetchTableData(options);
    
    // Generate filename
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const filename = `${options.table}_export_${timestamp}.${options.format}`;

    // Export based on format
    switch (options.format) {
      case 'csv':
        return {
          data: await this.exportToCSV(rawData, options),
          contentType: 'text/csv',
          filename,
        };
      
      case 'json':
        return {
          data: this.exportToJSON(rawData, options),
          contentType: 'application/json',
          filename,
        };
      
      case 'pdf':
        return {
          data: await this.exportToPDF(rawData, options),
          contentType: 'application/pdf',
          filename,
        };
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Fetch data from the specified table with filters
   */
  private async fetchTableData(options: ExportOptions): Promise<any[]> {
    let query = this.supabase.from(options.table).select('*');

    // Apply date filters
    if (options.dateFrom) {
      const dateColumn = this.getDateColumn(options.table);
      query = query.gte(dateColumn, options.dateFrom);
    }
    if (options.dateTo) {
      const dateColumn = this.getDateColumn(options.table);
      query = query.lte(dateColumn, options.dateTo);
    }

    // Apply additional filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      }
    }

    // Order by date descending
    const dateColumn = this.getDateColumn(options.table);
    query = query.order(dateColumn, { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Export data to CSV format
   */
  private async exportToCSV(data: any[], options: ExportOptions): Promise<string> {
    if (data.length === 0) {
      return 'No data available for export';
    }

    // Prepare data for CSV
    const processedData = data.map(row => {
      const processed: any = {};
      
      for (const [key, value] of Object.entries(row)) {
        // Skip internal fields unless metadata is requested
        if (!options.includeMetadata && ['id', 'created_at', 'updated_at', 'scraped_date'].includes(key)) {
          continue;
        }
        
        // Format values for CSV
        if (value === null || value === undefined) {
          processed[this.formatColumnName(key)] = '';
        } else if (value instanceof Date) {
          processed[this.formatColumnName(key)] = format(value, 'yyyy-MM-dd');
        } else if (typeof value === 'object') {
          processed[this.formatColumnName(key)] = JSON.stringify(value);
        } else {
          processed[this.formatColumnName(key)] = value;
        }
      }
      
      return processed;
    });

    // Generate CSV
    const csv = stringify(processedData, {
      header: true,
      columns: Object.keys(processedData[0]),
    });

    return csv;
  }

  /**
   * Export data to JSON format
   */
  private exportToJSON(data: any[], options: ExportOptions): string {
    const exportData = {
      metadata: {
        table: options.table,
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        filters: {
          dateFrom: options.dateFrom,
          dateTo: options.dateTo,
          ...options.filters,
        },
      },
      data: options.includeMetadata ? data : data.map(row => {
        const cleaned = { ...row };
        delete cleaned.id;
        delete cleaned.created_at;
        delete cleaned.updated_at;
        delete cleaned.scraped_date;
        return cleaned;
      }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export data to PDF format
   */
  private async exportToPDF(data: any[], options: ExportOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add header
      doc.fontSize(20).text('Queensland Youth Justice Data Export', 50, 50);
      doc.fontSize(12).text(`Table: ${this.formatTableName(options.table)}`, 50, 80);
      doc.text(`Export Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 50, 100);
      doc.text(`Records: ${data.length}`, 50, 120);

      if (options.dateFrom || options.dateTo) {
        doc.text(`Date Range: ${options.dateFrom || 'Start'} to ${options.dateTo || 'End'}`, 50, 140);
      }

      // Add table-specific content
      doc.moveDown();
      
      switch (options.table) {
        case 'youth_statistics':
          this.addYouthStatisticsToPDF(doc, data);
          break;
        case 'budget_allocations':
          this.addBudgetAllocationsToPDF(doc, data);
          break;
        case 'court_statistics':
          this.addCourtStatisticsToPDF(doc, data);
          break;
        case 'parliamentary_documents':
          this.addParliamentaryDocumentsToPDF(doc, data);
          break;
      }

      // Add footer
      doc.fontSize(10).text(
        'Data sourced from Queensland Government official reports',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    });
  }

  /**
   * Add youth statistics to PDF
   */
  private addYouthStatisticsToPDF(doc: any, data: any[]) {
    doc.fontSize(14).text('Youth Detention Statistics', { underline: true });
    doc.moveDown();

    data.slice(0, 50).forEach((stat, index) => {
      if (index > 0) doc.moveDown(0.5);
      
      doc.fontSize(12).text(`${stat.facility_name} - ${stat.date}`, { bold: true });
      doc.fontSize(10)
        .text(`Total Youth: ${stat.total_youth}`)
        .text(`Indigenous Youth: ${stat.indigenous_youth} (${stat.indigenous_percentage}%)`)
        .text(`Average Age: ${stat.average_age || 'N/A'}`)
        .text(`Average Stay: ${stat.average_stay_days || 'N/A'} days`);
    });

    if (data.length > 50) {
      doc.moveDown();
      doc.fontSize(10).text(`... and ${data.length - 50} more records`, { italic: true });
    }
  }

  /**
   * Add budget allocations to PDF
   */
  private addBudgetAllocationsToPDF(doc: any, data: any[]) {
    doc.fontSize(14).text('Budget Allocations', { underline: true });
    doc.moveDown();

    // Group by fiscal year
    const byYear = data.reduce((acc, allocation) => {
      if (!acc[allocation.fiscal_year]) acc[allocation.fiscal_year] = [];
      acc[allocation.fiscal_year].push(allocation);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(byYear).slice(0, 5).forEach(([year, allocations]) => {
      doc.fontSize(12).text(`Fiscal Year ${year}`, { bold: true });
      doc.moveDown(0.5);

      (allocations as any[]).slice(0, 10).forEach((allocation: any) => {
        doc.fontSize(10)
          .text(`${allocation.program}: $${allocation.amount.toLocaleString()}`)
          .text(`  Department: ${allocation.department}`)
          .text(`  Category: ${allocation.category}`);
        doc.moveDown(0.3);
      });

      if ((allocations as any[]).length > 10) {
        doc.fontSize(9).text(`... and ${(allocations as any[]).length - 10} more allocations`, { italic: true });
      }
      doc.moveDown();
    });
  }

  /**
   * Add court statistics to PDF
   */
  private addCourtStatisticsToPDF(doc: any, data: any[]) {
    doc.fontSize(14).text('Court Statistics', { underline: true });
    doc.moveDown();

    data.slice(0, 30).forEach((stat, index) => {
      if (index > 0) doc.moveDown(0.5);
      
      doc.fontSize(12).text(`${stat.court_type} Court - ${stat.report_period}`, { bold: true });
      doc.fontSize(10)
        .text(`Total Defendants: ${stat.total_defendants || 'N/A'}`)
        .text(`Indigenous Defendants: ${stat.indigenous_defendants || 'N/A'} (${stat.indigenous_percentage || 'N/A'}%)`)
        .text(`Bail Refused: ${stat.bail_refused_count || 'N/A'} (${stat.bail_refused_percentage || 'N/A'}%)`)
        .text(`Most Common Offence: ${stat.most_common_offence || 'N/A'}`);
    });
  }

  /**
   * Add parliamentary documents to PDF
   */
  private addParliamentaryDocumentsToPDF(doc: any, data: any[]) {
    doc.fontSize(14).text('Parliamentary Documents', { underline: true });
    doc.moveDown();

    data.slice(0, 20).forEach((document, index) => {
      if (index > 0) doc.moveDown(0.5);
      
      doc.fontSize(12).text(document.title, { bold: true });
      doc.fontSize(10)
        .text(`Type: ${document.document_type}`)
        .text(`Date: ${document.date}`)
        .text(`Author: ${document.author || 'Unknown'}`);
      
      const mentions = [];
      if (document.mentions_youth_justice) mentions.push('Youth Justice');
      if (document.mentions_spending) mentions.push('Spending');
      if (document.mentions_indigenous) mentions.push('Indigenous');
      
      if (mentions.length > 0) {
        doc.text(`Mentions: ${mentions.join(', ')}`);
      }
    });
  }

  /**
   * Get summary statistics for export
   */
  async getExportSummary(table: ExportTable, filters?: any): Promise<{
    totalRecords: number;
    dateRange: { from: string | null; to: string | null };
    estimatedSize: { csv: string; json: string; pdf: string };
  }> {
    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (filters?.dateFrom || filters?.dateTo) {
      const dateColumn = this.getDateColumn(table);
      if (filters.dateFrom) query = query.gte(dateColumn, filters.dateFrom);
      if (filters.dateTo) query = query.lte(dateColumn, filters.dateTo);
    }

    const { count } = await query;
    
    // Get date range
    const dateColumn = this.getDateColumn(table);
    const { data: dateRange } = await this.supabase
      .from(table)
      .select(dateColumn)
      .order(dateColumn, { ascending: true })
      .limit(1);
    
    const { data: maxDate } = await this.supabase
      .from(table)
      .select(dateColumn)
      .order(dateColumn, { ascending: false })
      .limit(1);

    // Estimate sizes (rough estimates)
    const avgRecordSize = 200; // bytes
    const totalRecords = count || 0;
    
    return {
      totalRecords,
      dateRange: {
        from: (dateRange?.[0] as any)?.[dateColumn] || null,
        to: (maxDate?.[0] as any)?.[dateColumn] || null,
      },
      estimatedSize: {
        csv: this.formatFileSize(totalRecords * avgRecordSize * 0.8),
        json: this.formatFileSize(totalRecords * avgRecordSize * 1.2),
        pdf: this.formatFileSize(totalRecords * avgRecordSize * 0.5),
      },
    };
  }

  /**
   * Helper: Get date column for table
   */
  private getDateColumn(table: ExportTable): string {
    switch (table) {
      case 'youth_statistics':
      case 'parliamentary_documents':
        return 'date';
      case 'budget_allocations':
        return 'fiscal_year';
      case 'court_statistics':
        return 'report_period';
      default:
        return 'created_at';
    }
  }

  /**
   * Helper: Format column name for display
   */
  private formatColumnName(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Helper: Format table name for display
   */
  private formatTableName(table: string): string {
    return table
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Helper: Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Export singleton instance
export const exportService = new ExportService();