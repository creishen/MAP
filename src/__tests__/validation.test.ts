/* 
  file summary: unit tests for maritime identifier validation routines and duplicate check rules.
  responsibilities: asserts correct behavior for imo number regex validation, duplicate imo/official registration checks, and charter buffer calculations.
  role in system: executed during vitest unit test suite runs.
*/

import { describe, it, expect } from 'vitest';
import { validateImoNumber, isDuplicateVessel, checkCharterBufferPassed } from '../utils/validation';
import { VesselParticulars } from '../types/vessel';

describe('Maritime Validation Utilities', () => {
  it('should validate valid 7-digit IMO numbers', () => {
    expect(validateImoNumber('9123456')).toBe(true);
    expect(validateImoNumber('9634721')).toBe(true);
  });

  it('should reject invalid IMO numbers', () => {
    expect(validateImoNumber('12345')).toBe(false);
    expect(validateImoNumber('91234567')).toBe(false);
    expect(validateImoNumber('IMO9123456')).toBe(false);
  });

  it('should detect duplicate vessel registration by IMO number', () => {
    const mockVessels: Partial<VesselParticulars>[] = [
      { name: 'MV Pacific Endeavour', imoNumber: '9123456', officialRegNumber: 'OSV-44-2019' },
    ];

    const result = isDuplicateVessel('9123456', 'NEW-REG-100', mockVessels as VesselParticulars[]);
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toContain('IMO number 9123456');
  });

  it('should detect duplicate vessel registration by Official Registration Number', () => {
    const mockVessels: Partial<VesselParticulars>[] = [
      { name: 'MV Pacific Endeavour', imoNumber: '9123456', officialRegNumber: 'OSV-44-2019' },
    ];

    const result = isDuplicateVessel('9999999', 'osv-44-2019', mockVessels as VesselParticulars[]);
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toContain('Official Registration Number OSV-44-2019');
  });

  it('should evaluate 6-month charter buffer rule correctly', () => {
    // Expiry in 2029 vs Charter End in 2027 => Buffer Passed
    expect(checkCharterBufferPassed('2029-01-14', '2027-11-01')).toBe(true);

    // Expiry in 2026 vs Charter End in 2027 => Buffer Failed
    expect(checkCharterBufferPassed('2026-11-30', '2027-11-01')).toBe(false);
  });
});
