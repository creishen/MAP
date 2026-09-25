/* 
  file summary: formatting utilities for dates, monetary figures, status badges, and maritime identifiers.
  responsibilities: converts raw dates to clean readable strings, maps ocr confidence levels to badge CSS classes, and formats IMO/MMSI numbers.
  role in system: used by table cells, details views, header banners, and drawer components.
*/

/**
  what: formats an ISO date string into a standard maritime date format (e.g. "15 SEP 2026").
  how: parses date object and outputs uppercase month abbreviation with day and 4-digit year.
  with what file: src/utils/formatters.ts used by DocumentTable.tsx, VesselDetailView.tsx, etc.
*/
export function formatMaritimeDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

/**
  what: returns the css badge class for ocr confidence percentage scores.
  how: evaluates score against >=95% high, >=90% medium, <90% low thresholds.
  with what file: src/utils/formatters.ts used by ConfidenceBadge.tsx and DocumentTable.tsx.
*/
export function getOcrConfidenceBadgeClass(confidenceScore: number): string {
  if (confidenceScore >= 95) return 'badge-conf-high';
  if (confidenceScore >= 90) return 'badge-conf-med';
  return 'badge-conf-low';
}

/**
  what: calculates remaining days until certificate expiration date.
  how: computes difference between target expiry date and current date in days.
  with what file: src/utils/formatters.ts used by VesselDetailView.tsx and DocumentTable.tsx.
*/
export function getDaysUntilExpiry(expiryDateStr: string): number {
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
  what: returns the css badge class and color styling for vessel operational registration status.
  how: maps awaiting orders to green, in-transit to yellow, port stay to blue, under charter to red, dry docking to grey.
  with what file: src/utils/formatters.ts used by VesselTable.tsx, VesselDetailView.tsx, etc.
*/
export function getVesselStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Awaiting Orders':
      return 'bg-success text-white';
    case 'In Transit':
    case 'In-Transit':
      return 'bg-warning text-dark';
    case 'Port Stay':
      return 'bg-primary text-white';
    case 'Under Charter':
      return 'bg-danger text-white';
    case 'Dry Docking':
    case 'Dry-Docking':
    case 'Lay-up':
      return 'bg-secondary text-white';
    case 'In Operations':
      return 'bg-success text-white';
    default:
      return 'bg-secondary text-white';
  }
}
