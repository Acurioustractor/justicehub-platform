import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database';

// Search parameters schema
export const searchParamsSchema = z.object({
  // General search
  query: z.string().optional(),
  tables: z.array(z.enum(['youth_statistics', 'budget_allocations', 'court_statistics', 'parliamentary_documents'])).optional(),
  
  // Date filtering
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  
  // Specific filters
  facility: z.string().optional(),
  department: z.string().optional(),
  courtType: z.enum(['childrens', 'magistrates', 'district', 'supreme']).optional(),
  documentType: z.enum(['hansard', 'report', 'brief', 'question', 'other']).optional(),
  
  // Numeric filters
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  minYouthCount: z.number().optional(),
  maxYouthCount: z.number().optional(),
  
  // Boolean filters
  indigenousOnly: z.boolean().optional(),
  detentionOnly: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  
  // Sorting
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

export interface SearchResult {
  type: 'youth_statistic' | 'budget_allocation' | 'court_statistic' | 'parliamentary_document';
  id: string;
  title: string;
  description: string;
  date: string;
  relevance?: number;
  data: any;
}

export class SearchService {
  private supabase = getSupabaseAdmin();

  /**
   * Perform multi-table search with advanced filtering
   */
  async search(params: SearchParams): Promise<{
    results: SearchResult[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    const validatedParams = searchParamsSchema.parse(params);
    const searchTables = validatedParams.tables || ['youth_statistics', 'budget_allocations', 'court_statistics', 'parliamentary_documents'];
    
    const allResults: SearchResult[] = [];
    
    // Search each table based on parameters
    const searchPromises = searchTables.map(table => {
      switch (table) {
        case 'youth_statistics':
          return this.searchYouthStatistics(validatedParams);
        case 'budget_allocations':
          return this.searchBudgetAllocations(validatedParams);
        case 'court_statistics':
          return this.searchCourtStatistics(validatedParams);
        case 'parliamentary_documents':
          return this.searchParliamentaryDocuments(validatedParams);
        default:
          return Promise.resolve([]);
      }
    });

    const results = await Promise.all(searchPromises);
    results.forEach(tableResults => allResults.push(...tableResults));

    // Sort by relevance or date
    allResults.sort((a, b) => {
      if (validatedParams.sortBy === 'relevance' && a.relevance && b.relevance) {
        return validatedParams.sortOrder === 'asc' ? a.relevance - b.relevance : b.relevance - a.relevance;
      }
      return validatedParams.sortOrder === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Pagination
    const totalCount = allResults.length;
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const startIndex = (validatedParams.page - 1) * validatedParams.limit;
    const paginatedResults = allResults.slice(startIndex, startIndex + validatedParams.limit);

    return {
      results: paginatedResults,
      totalCount,
      page: validatedParams.page,
      totalPages,
    };
  }

  /**
   * Search youth statistics with filters
   */
  private async searchYouthStatistics(params: SearchParams): Promise<SearchResult[]> {
    let query = this.supabase
      .from('youth_statistics')
      .select('*');

    // Apply filters
    if (params.dateFrom) {
      query = query.gte('date', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('date', params.dateTo);
    }
    if (params.facility) {
      query = query.ilike('facility_name', `%${params.facility}%`);
    }
    if (params.minYouthCount) {
      query = query.gte('total_youth', params.minYouthCount);
    }
    if (params.maxYouthCount) {
      query = query.lte('total_youth', params.maxYouthCount);
    }
    if (params.detentionOnly) {
      query = query.eq('program_type', 'detention');
    }

    const { data, error } = await query;
    
    if (error || !data) return [];

    return data.map(stat => ({
      type: 'youth_statistic' as const,
      id: stat.id,
      title: `${stat.facility_name} - ${stat.date}`,
      description: `Total: ${stat.total_youth} youth (${stat.indigenous_percentage}% Indigenous)`,
      date: stat.date,
      data: stat,
    }));
  }

  /**
   * Search budget allocations with filters
   */
  private async searchBudgetAllocations(params: SearchParams): Promise<SearchResult[]> {
    let query = this.supabase
      .from('budget_allocations')
      .select('*');

    // Apply filters
    if (params.department) {
      query = query.ilike('department', `%${params.department}%`);
    }
    if (params.minAmount) {
      query = query.gte('amount', params.minAmount);
    }
    if (params.maxAmount) {
      query = query.lte('amount', params.maxAmount);
    }
    if (params.query) {
      query = query.or(`program.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }

    const { data, error } = await query;
    
    if (error || !data) return [];

    return data.map(allocation => ({
      type: 'budget_allocation' as const,
      id: allocation.id,
      title: `${allocation.program} - ${allocation.fiscal_year}`,
      description: `${allocation.department}: $${allocation.amount.toLocaleString()}`,
      date: allocation.fiscal_year,
      data: allocation,
    }));
  }

  /**
   * Search court statistics with filters
   */
  private async searchCourtStatistics(params: SearchParams): Promise<SearchResult[]> {
    let query = this.supabase
      .from('court_statistics')
      .select('*');

    // Apply filters
    if (params.courtType) {
      query = query.eq('court_type', params.courtType);
    }
    if (params.query) {
      query = query.or(`report_period.ilike.%${params.query}%,most_common_offence.ilike.%${params.query}%`);
    }

    const { data, error } = await query;
    
    if (error || !data) return [];

    return data.map(stat => ({
      type: 'court_statistic' as const,
      id: stat.id,
      title: `${stat.court_type} Court - ${stat.report_period}`,
      description: `${stat.total_defendants || 0} defendants (${stat.indigenous_percentage || 0}% Indigenous)`,
      date: stat.report_period,
      data: stat,
    }));
  }

  /**
   * Search parliamentary documents with filters
   */
  private async searchParliamentaryDocuments(params: SearchParams): Promise<SearchResult[]> {
    let query = this.supabase
      .from('parliamentary_documents')
      .select('*');

    // Apply filters
    if (params.dateFrom) {
      query = query.gte('date', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('date', params.dateTo);
    }
    if (params.documentType) {
      query = query.eq('document_type', params.documentType);
    }
    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,content.ilike.%${params.query}%,author.ilike.%${params.query}%`);
    }
    if (params.indigenousOnly) {
      query = query.eq('mentions_indigenous', true);
    }

    const { data, error } = await query;
    
    if (error || !data) return [];

    // Calculate relevance based on mentions
    return data.map(doc => {
      let relevance = 0;
      if (doc.mentions_youth_justice) relevance += 3;
      if (doc.mentions_spending) relevance += 2;
      if (doc.mentions_indigenous) relevance += 2;
      
      if (params.query) {
        const queryLower = params.query.toLowerCase();
        const titleMatches = (doc.title.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
        const contentMatches = (doc.content?.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
        relevance += titleMatches * 2 + contentMatches;
      }

      return {
        type: 'parliamentary_document' as const,
        id: doc.id,
        title: doc.title,
        description: `${doc.document_type} by ${doc.author || 'Unknown'} - ${doc.date}`,
        date: doc.date,
        relevance,
        data: doc,
      };
    });
  }

  /**
   * Get search suggestions based on existing data
   */
  async getSearchSuggestions(prefix: string, table?: string): Promise<string[]> {
    const suggestions = new Set<string>();

    if (!table || table === 'youth_statistics') {
      const { data } = await this.supabase
        .from('youth_statistics')
        .select('facility_name')
        .ilike('facility_name', `${prefix}%`)
        .limit(5);
      
      data?.forEach(item => suggestions.add(item.facility_name));
    }

    if (!table || table === 'budget_allocations') {
      const { data } = await this.supabase
        .from('budget_allocations')
        .select('department, program')
        .or(`department.ilike.${prefix}%,program.ilike.${prefix}%`)
        .limit(5);
      
      data?.forEach(item => {
        suggestions.add(item.department);
        suggestions.add(item.program);
      });
    }

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Get filter options for dropdowns
   */
  async getFilterOptions() {
    const [facilities, departments, courtTypes] = await Promise.all([
      this.supabase
        .from('youth_statistics')
        .select('facility_name'),
      this.supabase
        .from('budget_allocations')
        .select('department'),
      this.supabase
        .from('court_statistics')
        .select('court_type'),
    ]);

    return {
      facilities: [...new Set(facilities.data?.map(f => f.facility_name) || [])],
      departments: [...new Set(departments.data?.map(d => d.department) || [])],
      courtTypes: [...new Set(courtTypes.data?.map(c => c.court_type) || [])],
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();