/**
 * Formats a date into a human-readable string
 * @param date The date to format, can be a Date object, ISO string, or timestamp
 * @returns A formatted date string in the format "DD/MM/YYYY"
 */
export const formatDate = (date: Date | string | number | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) return '';
  
  // Format as DD/MM/YYYY
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}; 