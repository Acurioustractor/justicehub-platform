import {
  deleteSystem0FilterPreset,
  upsertSystem0FilterPreset,
} from '@/lib/funding/system0-presets';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const PRESET_ID = '33333333-3333-4333-8333-333333333333';

describe('system0-presets', () => {
  test('blocks updating another users private preset', async () => {
    const table = {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: PRESET_ID,
              is_shared: false,
              created_by: OWNER_ID,
            },
            error: null,
          }),
        })),
      })),
    };
    const serviceClient = {
      from: jest.fn(() => table),
    };

    await expect(
      upsertSystem0FilterPreset(serviceClient, {
        id: PRESET_ID,
        name: 'Private preset',
        filters: {},
        userId: OTHER_ID,
      })
    ).rejects.toThrow('Cannot edit a private preset owned by another user');
  });

  test('blocks deleting another users private preset', async () => {
    const table = {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: PRESET_ID,
              name: 'Private preset',
              is_shared: false,
              created_by: OWNER_ID,
            },
            error: null,
          }),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    };
    const serviceClient = {
      from: jest.fn(() => table),
    };

    await expect(
      deleteSystem0FilterPreset(serviceClient, PRESET_ID, {
        userId: OTHER_ID,
      })
    ).rejects.toThrow('Cannot delete a private preset owned by another user');
  });

  test('updates an existing shared preset', async () => {
    const table = {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: PRESET_ID,
              is_shared: true,
              created_by: OWNER_ID,
            },
            error: null,
          }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: PRESET_ID,
                name: 'Shared preset',
                filters: {
                  eventTypeFilter: 'scheduler_tick',
                  eventSourceFilter: '',
                  eventRunIdFilter: '',
                  eventFromDate: '',
                  eventToDate: '',
                  eventsLimit: 24,
                },
                is_shared: true,
                created_by: OWNER_ID,
                updated_by: OTHER_ID,
                created_at: '2026-02-27T00:00:00.000Z',
                updated_at: '2026-02-27T01:00:00.000Z',
              },
              error: null,
            }),
          })),
        })),
      })),
    };
    const serviceClient = {
      from: jest.fn(() => table),
    };

    const result = await upsertSystem0FilterPreset(serviceClient, {
      id: PRESET_ID,
      name: 'Shared preset',
      filters: {
        eventTypeFilter: 'scheduler_tick',
        eventsLimit: 24,
      },
      isShared: true,
      userId: OTHER_ID,
    });

    expect(result.id).toBe(PRESET_ID);
    expect(result.isShared).toBe(true);
    expect(result.updatedBy).toBe(OTHER_ID);
    expect(result.filters.eventTypeFilter).toBe('scheduler_tick');
    expect(result.filters.eventsLimit).toBe(24);
  });

  test('creates a new preset and clamps filter limits', async () => {
    let insertedRow: Record<string, unknown> | null = null;

    const table = {
      insert: jest.fn((rows: Record<string, unknown>[]) => {
        insertedRow = rows[0] || null;
        return {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: PRESET_ID,
                name: insertedRow?.name,
                filters: insertedRow?.filters,
                is_shared: insertedRow?.is_shared,
                created_by: insertedRow?.created_by,
                updated_by: insertedRow?.updated_by,
                created_at: '2026-02-27T00:00:00.000Z',
                updated_at: '2026-02-27T00:00:00.000Z',
              },
              error: null,
            }),
          })),
        };
      }),
    };
    const serviceClient = {
      from: jest.fn(() => table),
    };

    const result = await upsertSystem0FilterPreset(serviceClient, {
      name: 'New preset',
      filters: {
        eventSourceFilter: 'admin_presets',
        eventsLimit: 250,
      },
      isShared: false,
      userId: OWNER_ID,
    });

    expect(table.insert).toHaveBeenCalledTimes(1);
    expect(insertedRow).not.toBeNull();
    expect((insertedRow?.filters as { eventsLimit: number }).eventsLimit).toBe(100);
    expect(result.filters.eventsLimit).toBe(100);
    expect(result.isShared).toBe(false);
  });
});
