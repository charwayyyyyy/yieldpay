export function normalizeGhanaPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    return '0' + cleaned.substring(3);
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned;
  }
  
  // If user entered 9 digits assuming +233 prefix was missing (e.g. 24XXXXXXX)
  if (cleaned.length === 9) {
    return '0' + cleaned;
  }
  
  return cleaned; // return whatever if we can't figure it out, Moolre might still accept it or fail gracefully
}

export function toLocalGhanaPhone(phone: string): string {
  return normalizeGhanaPhone(phone);
}

export function toInternationalGhanaPhone(phone: string): string {
  const normalized = normalizeGhanaPhone(phone);
  if (normalized.startsWith('0') && normalized.length === 10) {
    return '+233' + normalized.substring(1);
  }
  return phone;
}

export function detectGhanaNetworkChannel(phone: string): string | null {
  const normalized = normalizeGhanaPhone(phone);
  if (normalized.length !== 10) return null;
  
  const prefix = normalized.substring(0, 3);
  
  // MTN Ghana: 024, 025, 053, 054, 055, 059
  const mtnPrefixes = ['024', '025', '053', '054', '055', '059'];
  // Telecel (Vodafone): 020, 050
  const telecelPrefixes = ['020', '050'];
  // AT (AirtelTigo): 026, 056, 027, 057
  const atPrefixes = ['026', '056', '027', '057'];
  
  if (mtnPrefixes.includes(prefix)) return '1'; // MTN = "1"
  if (telecelPrefixes.includes(prefix)) return '6'; // Telecel = "6"
  if (atPrefixes.includes(prefix)) return '7'; // AT = "7"
  
  return null; // Unknown network
}
