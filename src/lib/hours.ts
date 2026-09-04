/**
 * Check if a restaurant is currently open based on its hours config.
 * Supports both old flat format and new structured format.
 */
export function isCurrentlyOpen(hours: any): boolean {
  if (!hours) return false;

  const regular = hours.regular || hours;
  if (!regular || typeof regular !== 'object') return false;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  const todayHours = regular[today];

  if (!todayHours || todayHours === 'Closed' || todayHours === 'closed') return false;

  // Parse hours like "08:00-17:00"
  const match = todayHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return false;

  const [, startH, startM, endH, endM] = match;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseInt(startH) * 60 + parseInt(startM);
  const endMinutes = parseInt(endH) * 60 + parseInt(endM);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}
