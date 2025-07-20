import { NextRequest, NextResponse } from 'next/server';
import { youthStatisticsRepo } from '@/lib/repositories/youthStatistics';
import { withApiAuth, createApiSuccessResponse, createApiErrorResponse } from '@/lib/middleware/apiAuth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Public API schema with limitations
const publicQuerySchema = z.object({
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  facility: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  format: z.enum(['json', 'summary']).default('json'),
});

// GET endpoint with rate limiting and API key authentication
export const GET = withApiAuth('/api/public/youth-statistics', 'read')(
  async (request: NextRequest, { apiKey }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = publicQuerySchema.parse(Object.fromEntries(searchParams.entries()));

      // Get data based on format
      if (query.format === 'summary') {
        // Return summary statistics only
        const latest = await youthStatisticsRepo.getLatest(1);
        
        if (!latest || latest.length === 0) {
          return createApiErrorResponse('No data available', 404);
        }

        // Get unique facilities count
        const allStats = await youthStatisticsRepo.getLatest(1000);
        const uniqueFacilities = new Set(allStats.map(stat => stat.facility_name)).size;

        const summary = {
          totalFacilities: uniqueFacilities,
          latestStatistics: {
            date: latest[0].date,
            totalYouth: latest[0].total_youth,
            indigenousYouth: latest[0].indigenous_youth,
            indigenousPercentage: latest[0].indigenous_percentage,
          },
          dataUpdated: latest[0].scraped_date || latest[0].date,
        };

        return createApiSuccessResponse(summary);
      }

      // Return detailed data with filters
      let data;
      if (query.facility) {
        data = await youthStatisticsRepo.getByFacility(query.facility);
      } else if (query.dateFrom && query.dateTo) {
        data = await youthStatisticsRepo.getByDateRange(query.dateFrom, query.dateTo);
      } else {
        data = await youthStatisticsRepo.getLatest(query.limit || 50);
      }

      // Apply offset if needed
      if (query.offset && query.offset > 0) {
        data = data.slice(query.offset);
      }

      // Remove sensitive fields for public API
      const publicData = data.map(record => ({
        id: record.id,
        date: record.date,
        facility_name: record.facility_name,
        total_youth: record.total_youth,
        indigenous_youth: record.indigenous_youth,
        indigenous_percentage: record.indigenous_percentage,
        average_age: record.average_age,
        average_stay_days: record.average_stay_days,
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
          source: 'Queensland Government Youth Justice Data',
          license: 'Open Data License',
          lastUpdated: publicData[0]?.date || null,
        },
      };

      return createApiSuccessResponse(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createApiErrorResponse('Invalid query parameters', 400);
      }

      console.error('Public API error:', error);
      return createApiErrorResponse('Internal server error', 500);
    }
  }
);