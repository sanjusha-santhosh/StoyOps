// ERPNext Formatting Utilities

/**
 * Format currency according to ERPNext settings
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date according to ERPNext settings
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
};

export const formatPhone = (phone: string, countryCode: string = '+1'): string => {
  // A simple formatter as placeholder, the actual implementation 
  // might depend on an external library like libphonenumber-js later
  return `${countryCode} ${phone}`;
};
