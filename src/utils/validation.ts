/* 
  file summary: validation utilities for maritime identifiers, statutory expiry buffers, and duplicate check validations.
  responsibilities: provides validation routines for imo numbers, official registration numbers, charter buffer checks, and contact inputs.
  role in system: used by vessel registration modal, document verification pipeline, and store actions to enforce data integrity.
*/

import { VesselParticulars } from '../types/vessel';

/**
  what: validates if a string is a valid 7-digit maritime imo number.
  how: checks regex pattern matching exactly 7 numerical digits.
  with what file: src/utils/validation.ts used by VesselModal.tsx and useMapStore.ts.
*/
export function validateImoNumber(imo: string): boolean {
  const imoRegex = /^\d{7}$/;
  return imoRegex.test(imo.trim());
}

/**
  what: checks if an imo number or official registration number already exists in the registered fleet.
  how: iterates over active vessels and compares normalized imo and official registration numbers.
  with what file: src/utils/validation.ts used by VesselModal.tsx and useMapStore.ts.
*/
export function isDuplicateVessel(
  imoNumber: string,
  officialRegNumber: string,
  existingVessels: VesselParticulars[]
): { isDuplicate: boolean; reason?: string } {
  const cleanImo = imoNumber.trim();
  const cleanReg = officialRegNumber.trim().toUpperCase();

  const imoMatch = existingVessels.find((v) => v.imoNumber === cleanImo);
  if (imoMatch) {
    return {
      isDuplicate: true,
      reason: `A vessel with IMO number ${cleanImo} (${imoMatch.name}) is already registered in MAP.`,
    };
  }

  const regMatch = existingVessels.find((v) => v.officialRegNumber.toUpperCase() === cleanReg);
  if (regMatch) {
    return {
      isDuplicate: true,
      reason: `A vessel with Official Registration Number ${cleanReg} (${regMatch.name}) is already registered in MAP.`,
    };
  }

  return { isDuplicate: false };
}

/**
  what: checks if a certificate expiry date satisfies the mandatory 6-month (180 days) charter buffer rule.
  how: calculates the difference in days between expiry date and charter window end date.
  with what file: src/utils/validation.ts used by DocumentTable.tsx, DocumentDetailView.tsx, and AssuranceDetailView.tsx.
*/
export function checkCharterBufferPassed(expiryDateStr: string, charterEndStr: string): boolean {
  const expiry = new Date(expiryDateStr);
  const charterEnd = new Date(charterEndStr);
  const bufferMs = 180 * 24 * 60 * 60 * 1000; // 180 days buffer
  return expiry.getTime() - charterEnd.getTime() >= bufferMs;
}

/**
  what: validates contact phone number format to prevent duplicate or malformed operational contacts.
  how: evaluates international phone number regex format.
  with what file: src/utils/validation.ts used by forms and user contact inputs.
*/
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}
