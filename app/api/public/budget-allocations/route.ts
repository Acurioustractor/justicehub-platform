import { NextRequest, NextResponse } from 'next/server';
import { budgetAllocationsRepo } from '@/lib/repositories/budgetAllocations';
import { withApiAuth, createApiSuccessResponse, createApiErrorResponse } from '@/lib/middleware/apiAuth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Public API schema
const publicQuerySchema = z.object({
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  fiscalYear: z.string().optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  format: z.enum(['json', 'summary']).default('json'),
});

// GET endpoint for public budget data
export const GET = withApiAuth('/api/public/budget-allocations', 'read')(
  async (request: NextRequest, { apiKey }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = publicQuerySchema.parse(Object.fromEntries(searchParams.entries()));

      if (query.format === 'summary') {
        // Return summary by category
        const currentYear = new Date().getFullYear();
        const fiscalYear = query.fiscalYear || `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
        
        const allocations = await budgetAllocationsRepo.getByFiscalYear(fiscalYear);
        
        const summary = {
          fiscalYear,
          totalBudget: allocations.reduce((sum, a) => sum + a.amount, 0),
          byCategory: allocations.reduce((acc, allocation) => {
            acc[allocation.category] = (acc[allocation.category] || 0) + allocation.amount;
            return acc;
          }, {} as Record<string, number>),
          programCount: allocations.length,
        };

        return createApiSuccessResponse(summary);
      }

      // Return detailed data
      const filters: any = {};
      if (query.fiscalYear) filters.fiscal_year = query.fiscalYear;
      if (query.category) filters.category = query.category;
      if (query.department) filters.department = query.department;
      if (query.limit) filters.limit = query.limit || 50;

      let data = await budgetAllocationsRepo.getAll(filters);

      // Apply offset if needed
      if (query.offset && query.offset > 0) {
        data = data.slice(query.offset);
      }

      // Remove sensitive fields for public API
      const publicData = data.map(record => ({
        id: record.id,
        fiscal_year: record.fiscal_year,
        department: record.department,
        program: record.program,
        category: record.category,
        amount: record.amount,
        description: record.description,
      }));

      const response = {
        data: publicData,
        metadata: {
          count: publicData.length,
          limit: query.limit || 50,
          offset: query.offset || 0,
          hasMore: publicData.length === (query.limit || 50),
        },
        attribution: {
          source: 'Queensland Government Budget Papers',
          license: 'Open Data License',
          disclaimer: 'Budget figures are estimates and may be subject to change',
        },
      };

      return createApiSuccessResponse(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createApiErrorResponse('Invalid query parameters', 400);
      }

      console.error('Public budget API error:', error);
      return createApiErrorResponse('Internal server error', 500);
    }
  }
);