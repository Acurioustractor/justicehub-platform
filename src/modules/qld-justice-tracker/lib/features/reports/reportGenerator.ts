import { getSupabaseAdmin } from '@/lib/supabase/server';
import { withRetry } from '@/lib/supabase/errors';
import { youthStatisticsRepo } from '@/lib/repositories/youthStatistics';
import { budgetAllocationsRepo } from '@/lib/repositories/budgetAllocations';
import { comparativeAnalysisService } from '@/lib/features/analysis/comparativeAnalysis';
import { chartService } from '@/lib/features/visualization/chartService';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import PDFDocument from 'pdfkit';

export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'custom';
export type ReportFormat = 'pdf' | 'html' | 'json';

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  title: string;
  period: {
    from: string;
    to: string;
  };
  sections: ReportSection[];
  recipients?: string[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:mm format
  };
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'statistics' | 'analysis' | 'chart' | 'comparison' | 'text';
  enabled: boolean;
  config: any;
}

export interface GeneratedReport {
  id: string;
  config: ReportConfig;
  data: any;
  generatedAt: string;
  format: ReportFormat;
  filePath?: string;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

export class ReportGenerator {
  private supabase = getSupabaseAdmin();

  /**
   * Generate a report based on configuration
   */
  async generateReport(config: ReportConfig): Promise<GeneratedReport> {
    const reportId = crypto.randomUUID();
    
    try {
      // Create report record
      const report: GeneratedReport = {
        id: reportId,
        config,
        data: {},
        generatedAt: new Date().toISOString(),
        format: config.format,
        status: 'generating',
      };

      await this.saveReportRecord(report);

      // Generate report data
      const reportData = await this.collectReportData(config);
      
      // Generate file based on format
      let filePath: string | undefined;
      if (config.format === 'pdf') {
        filePath = await this.generatePDFReport(config, reportData);
      } else if (config.format === 'html') {
        filePath = await this.generateHTMLReport(config, reportData);
      }

      // Update report with completion
      const completedReport: GeneratedReport = {
        ...report,
        data: reportData,
        filePath,
        status: 'completed',
      };

      await this.updateReportRecord(completedReport);
      return completedReport;

    } catch (error) {
      // Update report with error
      const failedReport: GeneratedReport = {
        id: reportId,
        config,
        data: {},
        generatedAt: new Date().toISOString(),
        format: config.format,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.updateReportRecord(failedReport);
      throw error;
    }
  }

  /**
   * Collect data for all report sections
   */
  private async collectReportData(config: ReportConfig): Promise<any> {
    const reportData: any = {
      metadata: {
        title: config.title,
        period: config.period,
        generatedAt: new Date().toISOString(),
        type: config.type,
      },
      sections: {},
    };

    for (const section of config.sections) {
      if (!section.enabled) continue;

      try {
        reportData.sections[section.id] = await this.generateSectionData(section, config);
      } catch (error) {
        console.error(`Error generating section ${section.id}:`, error);
        reportData.sections[section.id] = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return reportData;
  }

  /**
   * Generate data for a specific report section
   */
  private async generateSectionData(section: ReportSection, config: ReportConfig): Promise<any> {
    switch (section.type) {
      case 'statistics':
        return this.generateStatisticsSection(section, config);
      
      case 'analysis':
        return this.generateAnalysisSection(section, config);
      
      case 'chart':
        return this.generateChartSection(section, config);
      
      case 'comparison':
        return this.generateComparisonSection(section, config);
      
      case 'text':
        return this.generateTextSection(section, config);
      
      default:
        throw new Error(`Unsupported section type: ${section.type}`);
    }
  }

  /**
   * Generate statistics section
   */
  private async generateStatisticsSection(section: ReportSection, config: ReportConfig): Promise<any> {
    const { from, to } = config.period;
    
    // Get youth statistics for the period
    const youthStats = await youthStatisticsRepo.getByDateRange(from, to);

    // Get budget data
    const currentYear = new Date().getFullYear();
    const fiscalYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    const budgetData = await budgetAllocationsRepo.getByFiscalYear(fiscalYear);

    // Calculate key metrics
    const totalYouth = youthStats.reduce((sum, stat) => sum + stat.total_youth, 0) / youthStats.length;
    const indigenousYouth = youthStats.reduce((sum, stat) => sum + stat.indigenous_youth, 0) / youthStats.length;
    const indigenousPercentage = (indigenousYouth / totalYouth) * 100;

    const totalBudget = budgetData.reduce((sum, allocation) => sum + allocation.amount, 0);
    const detentionBudget = budgetData
      .filter(a => a.category === 'detention')
      .reduce((sum, a) => sum + a.amount, 0);

    return {
      title: section.title,
      period: { from, to },
      metrics: {
        averageYouthDetained: Math.round(totalYouth),
        averageIndigenousYouth: Math.round(indigenousYouth),
        indigenousRepresentationPercentage: Math.round(indigenousPercentage * 10) / 10,
        totalBudgetAllocated: totalBudget,
        detentionBudgetPercentage: Math.round((detentionBudget / totalBudget) * 100),
        costPerYouthPerDay: Math.round(totalBudget / totalYouth / 365),
      },
      trends: {
        youthDetentionChange: this.calculatePeriodChange(youthStats, 'total_youth'),
        indigenousRepresentationChange: this.calculatePeriodChange(youthStats, 'indigenous_percentage'),
      },
      facilities: this.analyzeFacilityData(youthStats),
    };
  }

  /**
   * Generate analysis section
   */
  private async generateAnalysisSection(section: ReportSection, config: ReportConfig): Promise<any> {
    const analysisType = section.config?.analysisType || 'budget-efficiency';

    switch (analysisType) {
      case 'budget-efficiency':
        return {
          title: section.title,
          ...(await comparativeAnalysisService.analyzeBudgetEfficiency()),
        };
      
      case 'facilities':
        return {
          title: section.title,
          ...(await comparativeAnalysisService.compareFacilities()),
        };
      
      case 'regional':
        return {
          title: section.title,
          ...(await comparativeAnalysisService.analyzeRegionalDifferences()),
        };
      
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }
  }

  /**
   * Generate chart section
   */
  private async generateChartSection(section: ReportSection, config: ReportConfig): Promise<any> {
    const chartType = section.config?.chartType || 'youth-trends';
    const chartOptions = section.config?.options || {};

    let chartData;
    switch (chartType) {
      case 'youth-trends':
        chartData = await chartService.getYouthTrends(
          chartOptions.period || 'monthly',
          chartOptions.months || 12
        );
        break;
      
      case 'budget-breakdown':
        chartData = await chartService.getBudgetBreakdown(chartOptions.fiscalYear);
        break;
      
      case 'facility-comparison':
        chartData = await chartService.getFacilityComparison();
        break;
      
      case 'indigenous-representation':
        chartData = await chartService.getIndigenousRepresentation(chartOptions.months || 24);
        break;
      
      default:
        throw new Error(`Unsupported chart type: ${chartType}`);
    }

    return {
      title: section.title,
      chartType,
      ...chartData,
    };
  }

  /**
   * Generate comparison section
   */
  private async generateComparisonSection(section: ReportSection, config: ReportConfig): Promise<any> {
    const { from, to } = config.period;
    
    // Define comparison periods
    const currentPeriod = { label: 'Current Period', startDate: from, endDate: to };
    const previousPeriod = this.getPreviousPeriod(from, to, config.type);

    const periods = [previousPeriod, currentPeriod];
    
    const trendComparisons = await comparativeAnalysisService.compareDetentionTrends(
      periods,
      ['total_youth', 'indigenous_youth', 'indigenous_percentage']
    );

    return {
      title: section.title,
      periods,
      comparisons: trendComparisons,
      insights: this.generateComparisonInsights(trendComparisons),
    };
  }

  /**
   * Generate text section
   */
  private generateTextSection(section: ReportSection, config: ReportConfig): any {
    return {
      title: section.title,
      content: section.config?.content || '',
      variables: {
        reportDate: format(new Date(), 'dd MMMM yyyy'),
        periodFrom: format(new Date(config.period.from), 'dd MMMM yyyy'),
        periodTo: format(new Date(config.period.to), 'dd MMMM yyyy'),
      },
    };
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(config: ReportConfig, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `report_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`;
      const filePath = `/tmp/${fileName}`;
      
      const stream = require('fs').createWriteStream(filePath);
      doc.pipe(stream);

      // Title page
      doc.fontSize(24).text(config.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Report Period: ${data.metadata.period.from} to ${data.metadata.period.to}`, { align: 'center' });
      doc.text(`Generated: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, { align: 'center' });
      doc.addPage();

      // Table of contents
      doc.fontSize(18).text('Table of Contents', { underline: true });
      doc.moveDown();
      
      let pageNumber = 3;
      Object.values(data.sections).forEach((section: any) => {
        if (section.title) {
          doc.fontSize(12).text(`${section.title} ........................ ${pageNumber}`, { link: `#section-${pageNumber}` });
          pageNumber++;
        }
      });
      
      doc.addPage();

      // Generate sections
      Object.entries(data.sections).forEach(([sectionId, sectionData]: [string, any]) => {
        if (sectionData.error) {
          doc.fontSize(16).text(`${sectionData.title || sectionId} (Error)`, { underline: true });
          doc.moveDown();
          doc.fontSize(12).text(`Error: ${sectionData.error}`);
          doc.addPage();
          return;
        }

        this.addSectionToPDF(doc, sectionData);
        doc.addPage();
      });

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10).text(
          `Queensland Youth Justice Tracker - Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
      
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * Add section content to PDF
   */
  private addSectionToPDF(doc: any, sectionData: any): void {
    doc.fontSize(16).text(sectionData.title, { underline: true });
    doc.moveDown();

    if (sectionData.metrics) {
      doc.fontSize(14).text('Key Metrics:', { underline: true });
      doc.moveDown(0.5);
      
      Object.entries(sectionData.metrics).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.fontSize(12).text(`${label}: ${value}`);
      });
      doc.moveDown();
    }

    if (sectionData.insights) {
      doc.fontSize(14).text('Key Insights:', { underline: true });
      doc.moveDown(0.5);
      
      sectionData.insights.forEach((insight: string) => {
        doc.fontSize(12).text(`• ${insight}`);
      });
      doc.moveDown();
    }

    if (sectionData.content) {
      doc.fontSize(12).text(sectionData.content);
      doc.moveDown();
    }
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(config: ReportConfig, data: any): Promise<string> {
    const fileName = `report_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.html`;
    const filePath = `/tmp/${fileName}`;
    
    const html = this.generateHTMLContent(config, data);
    
    require('fs').writeFileSync(filePath, html);
    return filePath;
  }

  /**
   * Generate HTML content
   */
  private generateHTMLContent(config: ReportConfig, data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${config.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .section { margin-bottom: 30px; page-break-before: always; }
        .section h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .chart-placeholder { background: #e0e0e0; height: 300px; display: flex; align-items: center; justify-content: center; }
        ul { padding-left: 20px; }
        @media print { .section { page-break-before: always; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${config.title}</h1>
        <p>Report Period: ${data.metadata.period.from} to ${data.metadata.period.to}</p>
        <p>Generated: ${format(new Date(), 'dd MMMM yyyy HH:mm')}</p>
    </div>
    
    ${Object.entries(data.sections).map(([sectionId, sectionData]: [string, any]) => 
      this.generateHTMLSection(sectionData)
    ).join('')}
</body>
</html>`;
  }

  /**
   * Generate HTML section
   */
  private generateHTMLSection(sectionData: any): string {
    if (sectionData.error) {
      return `<div class="section">
        <h2>${sectionData.title || 'Section'} (Error)</h2>
        <p style="color: red;">Error: ${sectionData.error}</p>
      </div>`;
    }

    let html = `<div class="section"><h2>${sectionData.title}</h2>`;

    if (sectionData.metrics) {
      html += '<div class="metrics">';
      Object.entries(sectionData.metrics).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        html += `<div class="metric"><strong>${label}</strong><br>${value}</div>`;
      });
      html += '</div>';
    }

    if (sectionData.chartType) {
      html += `<div class="chart-placeholder">Chart: ${sectionData.chartType}</div>`;
    }

    if (sectionData.insights) {
      html += '<h3>Key Insights:</h3><ul>';
      sectionData.insights.forEach((insight: string) => {
        html += `<li>${insight}</li>`;
      });
      html += '</ul>';
    }

    if (sectionData.content) {
      html += `<p>${sectionData.content}</p>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Helper: Calculate period change
   */
  private calculatePeriodChange(data: any[], field: string): number {
    if (data.length < 2) return 0;
    
    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstValue = sortedData[0][field];
    const lastValue = sortedData[sortedData.length - 1][field];
    
    return firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  }

  /**
   * Helper: Analyze facility data
   */
  private analyzeFacilityData(youthStats: any[]): any {
    const facilityData = new Map();
    
    youthStats.forEach(stat => {
      const current = facilityData.get(stat.facility_name) || { total: 0, count: 0 };
      current.total += stat.total_youth;
      current.count += 1;
      facilityData.set(stat.facility_name, current);
    });

    return Array.from(facilityData.entries())
      .map(([name, data]: [string, any]) => ({
        name,
        averageCapacity: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.averageCapacity - a.averageCapacity);
  }

  /**
   * Helper: Get previous period for comparison
   */
  private getPreviousPeriod(from: string, to: string, reportType: ReportType): any {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const duration = toDate.getTime() - fromDate.getTime();
    
    const previousTo = new Date(fromDate.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - duration);
    
    return {
      label: 'Previous Period',
      startDate: previousFrom.toISOString().split('T')[0],
      endDate: previousTo.toISOString().split('T')[0],
    };
  }

  /**
   * Helper: Generate comparison insights
   */
  private generateComparisonInsights(comparisons: any[]): string[] {
    const insights: string[] = [];
    
    comparisons.forEach(comparison => {
      const latestData = comparison.data[comparison.data.length - 1];
      if (latestData && Math.abs(latestData.changePercentage) > 5) {
        const direction = latestData.changePercentage > 0 ? 'increased' : 'decreased';
        insights.push(
          `${comparison.metric} has ${direction} by ${Math.abs(latestData.changePercentage).toFixed(1)}% compared to the previous period`
        );
      }
    });
    
    return insights;
  }

  /**
   * Save report record to database
   */
  private async saveReportRecord(report: GeneratedReport): Promise<void> {
    await this.supabase
      .from('generated_reports')
      .insert({
        id: report.id,
        config: report.config,
        generated_at: report.generatedAt,
        format: report.format,
        status: report.status,
        file_path: report.filePath,
        error: report.error,
      });
  }

  /**
   * Update report record in database
   */
  private async updateReportRecord(report: GeneratedReport): Promise<void> {
    await this.supabase
      .from('generated_reports')
      .update({
        data: report.data,
        status: report.status,
        file_path: report.filePath,
        error: report.error,
      })
      .eq('id', report.id);
  }

  /**
   * Get report history
   */
  async getReportHistory(limit: number = 50): Promise<GeneratedReport[]> {
    const { data, error } = await this.supabase
      .from('generated_reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch report history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get default report configurations
   */
  getDefaultConfigs(): Record<string, ReportConfig> {
    return {
      monthly: {
        type: 'monthly',
        format: 'pdf',
        title: 'Monthly Youth Justice Report',
        period: {
          from: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
          to: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
        },
        sections: [
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            type: 'statistics',
            enabled: true,
            config: {},
          },
          {
            id: 'trends',
            title: 'Youth Detention Trends',
            type: 'chart',
            enabled: true,
            config: { chartType: 'youth-trends', options: { period: 'monthly', months: 12 } },
          },
          {
            id: 'budget-analysis',
            title: 'Budget Efficiency Analysis',
            type: 'analysis',
            enabled: true,
            config: { analysisType: 'budget-efficiency' },
          },
          {
            id: 'facility-comparison',
            title: 'Facility Performance',
            type: 'analysis',
            enabled: true,
            config: { analysisType: 'facilities' },
          },
          {
            id: 'period-comparison',
            title: 'Period Comparison',
            type: 'comparison',
            enabled: true,
            config: {},
          },
        ],
      },
    };
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();