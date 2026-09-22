export function toWhatsAppDigits(phone: string, callingCode: string): string | null {
  let digits = phone.replace(/\D/g, "");
  const code = callingCode.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);

  if (code && digits.startsWith("0")) {
    digits = code + digits.slice(1);
  } else if (code && digits.length <= 10 && !digits.startsWith(code)) {
    digits = code + digits;
  }

  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function toWhatsAppJid(digits: string) {
  return `${digits}@s.whatsapp.net`;
}
