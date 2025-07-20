import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { youthStatisticsRepo } from '@/lib/repositories/youthStatistics';
import { budgetAllocationsRepo } from '@/lib/repositories/budgetAllocations';
import type { Database } from '@/types/database';

// Test database configuration
const testSupabaseUrl = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL;
const testSupabaseKey = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!testSupabaseUrl || !testSupabaseKey) {
  throw new Error('Test database configuration is missing');
}

const testClient = createClient<Database>(testSupabaseUrl, testSupabaseKey);

describe('Database Repository Tests', () => {
  // Cleanup function to remove test data
  async function cleanupTestData() {
    const tables = ['youth_statistics', 'budget_allocations', 'court_statistics'];
    
    for (const table of tables) {
      await testClient
        .from(table as any)
        .delete()
        .like('source_url', '%test%');
    }
  }

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData();
  });

  describe('Youth Statistics Repository', () => {
    const testYouthStat = {
      date: '2024-01-01',
      facility_name: 'Test Facility',
      total_youth: 100,
      indigenous_youth: 60,
      indigenous_percentage: 60.0,
      average_age: 16.5,
      average_stay_days: 90,
      program_type: 'detention' as const,
      source_url: 'https://test-source.com/youth-stats',
    };

    it('should create a new youth statistic', async () => {
      const created = await youthStatisticsRepo.create(testYouthStat);
      
      expect(created.id).toBeDefined();
      expect(created.facility_name).toBe(testYouthStat.facility_name);
      expect(created.total_youth).toBe(testYouthStat.total_youth);
      expect(created.indigenous_percentage).toBe(testYouthStat.indigenous_percentage);
    });

    it('should validate data integrity during creation', async () => {
      const invalidStat = {
        ...testYouthStat,
        indigenous_youth: 150, // More than total_youth
        facility_name: 'Test Invalid Facility',
      };

      await expect(youthStatisticsRepo.create(invalidStat))
        .rejects
        .toThrow(/Indigenous youth count cannot exceed total youth count/);
    });

    it('should retrieve latest statistics', async () => {
      // Create a few test records
      const stats = [
        { ...testYouthStat, date: '2024-01-01', facility_name: 'Test Facility A' },
        { ...testYouthStat, date: '2024-01-02', facility_name: 'Test Facility B' },
        { ...testYouthStat, date: '2024-01-03', facility_name: 'Test Facility C' },
      ];

      for (const stat of stats) {
        await youthStatisticsRepo.create(stat);
      }

      const latest = await youthStatisticsRepo.getLatest(2);
      
      expect(latest).toHaveLength(2);
      expect(latest[0].date).toBe('2024-01-03'); // Most recent first
      expect(latest[1].date).toBe('2024-01-02');
    });

    it('should filter by date range', async () => {
      const stats = await youthStatisticsRepo.getByDateRange('2024-01-01', '2024-01-02');
      
      expect(stats.every(s => s.date >= '2024-01-01' && s.date <= '2024-01-02')).toBe(true);
    });

    it('should filter by facility', async () => {
      const facilityStats = await youthStatisticsRepo.getByFacility('Test Facility A');
      
      expect(facilityStats.every(s => s.facility_name === 'Test Facility A')).toBe(true);
    });

    it('should get aggregated statistics', async () => {
      const aggregated = await youthStatisticsRepo.getAggregatedStats();
      
      if (aggregated) {
        expect(aggregated.latest).toBeDefined();
        expect(aggregated.metrics.totalYouth).toBeGreaterThan(0);
        expect(aggregated.metrics.dailyCost).toBeGreaterThan(0);
      }
    });

    it('should get trend data', async () => {
      const trends = await youthStatisticsRepo.getTrendData(30);
      
      expect(Array.isArray(trends)).toBe(true);
      if (trends.length > 0) {
        expect(trends[0]).toHaveProperty('date');
        expect(trends[0]).toHaveProperty('total');
        expect(trends[0]).toHaveProperty('indigenous');
        expect(trends[0]).toHaveProperty('percentage');
      }
    });
  });

  describe('Budget Allocations Repository', () => {
    const testBudgetAllocation = {
      fiscal_year: '2024-25',
      department: 'Test Department',
      program: 'Test Program',
      category: 'detention',
      amount: 1000000,
      description: 'Test budget allocation',
      source_url: 'https://test-source.com/budget',
      source_document: 'Test Budget Paper 1',
    };

    it('should create a new budget allocation', async () => {
      const created = await budgetAllocationsRepo.create(testBudgetAllocation);
      
      expect(created.id).toBeDefined();
      expect(created.department).toBe(testBudgetAllocation.department);
      expect(created.amount).toBe(testBudgetAllocation.amount);
    });

    it('should validate fiscal year format', async () => {
      const invalidAllocation = {
        ...testBudgetAllocation,
        fiscal_year: '2024', // Invalid format
        program: 'Test Invalid Program',
      };

      await expect(budgetAllocationsRepo.create(invalidAllocation))
        .rejects
        .toThrow(/Fiscal year must be in YYYY-YY format/);
    });

    it('should retrieve all allocations with filters', async () => {
      const allocations = await budgetAllocationsRepo.getAll({
        fiscal_year: '2024-25',
        department: 'Test Department',
        limit: 10,
      });
      
      expect(Array.isArray(allocations)).toBe(true);
      if (allocations.length > 0) {
        expect(allocations.every(a => a.fiscal_year === '2024-25')).toBe(true);
        expect(allocations.every(a => a.department === 'Test Department')).toBe(true);
      }
    });

    it('should get allocations by fiscal year', async () => {
      const allocations = await budgetAllocationsRepo.getByFiscalYear('2024-25');
      
      expect(Array.isArray(allocations)).toBe(true);
      expect(allocations.every(a => a.fiscal_year === '2024-25')).toBe(true);
    });

    it('should calculate totals by category', async () => {
      const totals = await budgetAllocationsRepo.getTotalsByCategory('2024-25');
      
      expect(Array.isArray(totals)).toBe(true);
      if (totals.length > 0) {
        expect(totals[0]).toHaveProperty('category');
        expect(totals[0]).toHaveProperty('total');
      }
    });

    it('should get department rankings', async () => {
      const rankings = await budgetAllocationsRepo.getDepartmentRankings('2024-25');
      
      expect(Array.isArray(rankings)).toBe(true);
      if (rankings.length > 1) {
        // Should be sorted by total descending
        expect(rankings[0].total).toBeGreaterThanOrEqual(rankings[1].total);
      }
    });

    it('should calculate efficiency metrics', async () => {
      const metrics = await budgetAllocationsRepo.getEfficiencyMetrics('2024-25');
      
      expect(metrics).toHaveProperty('totalBudget');
      expect(metrics).toHaveProperty('detentionBudget');
      expect(metrics).toHaveProperty('communityBudget');
      expect(metrics).toHaveProperty('detentionPercentage');
      expect(metrics).toHaveProperty('communityPercentage');
      expect(metrics.totalBudget).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Create a client with invalid credentials
      const invalidClient = createClient('https://invalid.supabase.co', 'invalid-key');
      
      try {
        await invalidClient.from('youth_statistics').select('*').limit(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        // Missing required fields
        facility_name: '',
        total_youth: -1, // Invalid value
      };

      await expect(youthStatisticsRepo.create(invalidData as any))
        .rejects
        .toThrow();
    });

    it('should handle duplicate key errors', async () => {
      // This would test unique constraint violations
      // Implementation depends on your specific constraints
    });
  });

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      
      await youthStatisticsRepo.getLatest(1000);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        youthStatisticsRepo.create({
          ...testYouthStat,
          facility_name: `Concurrent Test Facility ${i}`,
          date: '2024-02-01',
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(results.every(r => r.id)).toBe(true);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data integrity across updates', async () => {
      const created = await youthStatisticsRepo.create({
        ...testYouthStat,
        facility_name: 'Update Test Facility',
      });

      const updated = await youthStatisticsRepo.update(created.id, {
        total_youth: 120,
        indigenous_youth: 72,
        indigenous_percentage: 60.0,
      });

      expect(updated.total_youth).toBe(120);
      expect(updated.indigenous_youth).toBe(72);
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    it('should enforce business rules during updates', async () => {
      const created = await youthStatisticsRepo.create({
        ...testYouthStat,
        facility_name: 'Business Rule Test Facility',
      });

      await expect(
        youthStatisticsRepo.update(created.id, {
          indigenous_youth: 200, // More than total_youth
        })
      ).rejects.toThrow();
    });
  });
});