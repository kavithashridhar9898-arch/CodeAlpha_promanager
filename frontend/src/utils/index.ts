// Export all utility functions from this barrel file

/**
 * Utility to join class names conditionally.
 * Prefer using `cn` from '@/lib/utils' (shadcn convention) for Tailwind.
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}
