/**
 * Unit tests for AuthService utility functions.
 * These tests use mocked Prisma — no database needed.
 */

// ─── Hash Utility Tests ───────────────────────────────────────────────────────
describe('Password Hashing Utilities', () => {
  it('should hash a password and verify it correctly', async () => {
    // Simulate the pattern used in authService
    const bcrypt = await import('bcryptjs');
    const password = 'SecurePassword123!';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).not.toBe(password);
    const isMatch = await bcrypt.compare(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should reject wrong passwords', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('correct-password', 10);
    const isMatch = await bcrypt.compare('wrong-password', hash);
    expect(isMatch).toBe(false);
  });
});

// ─── Response Utility Tests ───────────────────────────────────────────────────
describe('Response Utility', () => {
  it('should format a success response correctly', async () => {
    const { successResponse } = await import('../utils/response');
    const result = successResponse({ id: '1', name: 'Test' }, 'Fetched successfully');
    
    expect(result).toEqual({
      status: 'success',
      data: { id: '1', name: 'Test' },
      message: 'Fetched successfully',
    });
  });

  it('should format a success response without message', async () => {
    const { successResponse } = await import('../utils/response');
    const result = successResponse(null);
    
    expect(result.status).toBe('success');
    expect(result.data).toBeNull();
  });
});

// ─── AppError Tests ───────────────────────────────────────────────────────────
describe('AppError', () => {
  it('should create an AppError with the correct properties', async () => {
    const { AppError } = await import('../utils/AppError');
    const error = new AppError('Not Found', 404);
    
    expect(error.message).toBe('Not Found');
    expect(error.statusCode).toBe(404);
    expect(error).toBeInstanceOf(Error);
  });

  it('should default to status 500', async () => {
    const { AppError } = await import('../utils/AppError');
    const error = new AppError('Internal error');
    expect(error.statusCode).toBe(500);
  });
});

// ─── CSV Export Logic Test ────────────────────────────────────────────────────
describe('CSV Generation', () => {
  // Extracted CSV logic for testing
  function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
    const escape = (v: string | number | null | undefined) => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const lines = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))];
    return lines.join('\n');
  }

  it('should generate valid CSV with headers and rows', () => {
    const csv = toCSV(['ID', 'Name', 'Status'], [['1', 'Test Task', 'TODO']]);
    expect(csv).toBe('ID,Name,Status\n1,Test Task,TODO');
  });

  it('should escape commas in values', () => {
    const csv = toCSV(['Title'], [['Task, with comma']]);
    expect(csv).toContain('"Task, with comma"');
  });

  it('should handle null values', () => {
    const csv = toCSV(['Title', 'Due'], [['My Task', null]]);
    expect(csv).toBe('Title,Due\nMy Task,');
  });
});
