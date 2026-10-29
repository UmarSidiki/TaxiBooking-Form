import type { LocalizedTemplates } from "@/features/notifications/notification-types";

export const rideAssignedTemplates: LocalizedTemplates = {
  en: { body: "Ride {{tripId}} is assigned to you. {{pickup}} on {{date}} at {{time}}." },
  fr: { body: "La course {{tripId}} vous est attribuée. {{pickup}} le {{date}} à {{time}}." },
  es: { body: "El viaje {{tripId}} te ha sido asignado. {{pickup}} el {{date}} a las {{time}}." },
  de: { body: "Fahrt {{tripId}} wurde Ihnen zugewiesen. {{pickup}} am {{date}} um {{time}}." },
  nl: { body: "Rit {{tripId}} is aan u toegewezen. {{pickup}} op {{date}} om {{time}}." },
  it: { body: "La corsa {{tripId}} ti è stata assegnata. {{pickup}} il {{date}} alle {{time}}." },
  ru: { body: "Поездка {{tripId}} назначена вам. {{pickup}}, {{date}} в {{time}}." },
  ar: { body: "الرحلة {{tripId}} مسندة إليك. {{pickup}} في {{date}} الساعة {{time}}." },
};

export const rideAvailableTemplates: LocalizedTemplates = {
  en: { body: "Ride {{tripId}} is available to claim. {{pickup}} on {{date}} at {{time}}." },
  fr: { body: "La course {{tripId}} est disponible. {{pickup}} le {{date}} à {{time}}." },
  es: { body: "El viaje {{tripId}} está disponible para tomar. {{pickup}} el {{date}} a las {{time}}." },
  de: { body: "Fahrt {{tripId}} kann übernommen werden. {{pickup}} am {{date}} um {{time}}." },
  nl: { body: "Rit {{tripId}} is beschikbaar om te claimen. {{pickup}} op {{date}} om {{time}}." },
  it: { body: "La corsa {{tripId}} è disponibile. {{pickup}} il {{date}} alle {{time}}." },
  ru: { body: "Поездку {{tripId}} можно взять. {{pickup}}, {{date}} в {{time}}." },
  ar: { body: "الرحلة {{tripId}} متاحة للقبول. {{pickup}} في {{date}} الساعة {{time}}." },
};

export const rideChangedTemplates: LocalizedTemplates = {
  en: { body: "Ride {{tripId}} was changed. {{pickup}} on {{date}} at {{time}}." },
  fr: { body: "La course {{tripId}} a été modifiée. {{pickup}} le {{date}} à {{time}}." },
  es: { body: "El viaje {{tripId}} ha cambiado. {{pickup}} el {{date}} a las {{time}}." },
  de: { body: "Fahrt {{tripId}} wurde geändert. {{pickup}} am {{date}} um {{time}}." },
  nl: { body: "Rit {{tripId}} is gewijzigd. {{pickup}} op {{date}} om {{time}}." },
  it: { body: "La corsa {{tripId}} è stata modificata. {{pickup}} il {{date}} alle {{time}}." },
  ru: { body: "Поездка {{tripId}} изменена. {{pickup}}, {{date}} в {{time}}." },
  ar: { body: "تم تغيير الرحلة {{tripId}}. {{pickup}} في {{date}} الساعة {{time}}." },
};

export const rideCancelledTemplates: LocalizedTemplates = {
  en: { body: "Ride {{tripId}} was cancelled. {{pickup}} on {{date}} at {{time}}." },
  fr: { body: "La course {{tripId}} a été annulée. {{pickup}} le {{date}} à {{time}}." },
  es: { body: "El viaje {{tripId}} ha sido cancelado. {{pickup}} el {{date}} a las {{time}}." },
  de: { body: "Fahrt {{tripId}} wurde storniert. {{pickup}} am {{date}} um {{time}}." },
  nl: { body: "Rit {{tripId}} is geannuleerd. {{pickup}} op {{date}} om {{time}}." },
  it: { body: "La corsa {{tripId}} è stata annullata. {{pickup}} il {{date}} alle {{time}}." },
  ru: { body: "Поездка {{tripId}} отменена. {{pickup}}, {{date}} в {{time}}." },
  ar: { body: "تم إلغاء الرحلة {{tripId}}. {{pickup}} في {{date}} الساعة {{time}}." },
};

export const pickupReminderTemplates: LocalizedTemplates = {
  en: { body: "Pickup reminder: {{tripId}} at {{pickup}} on {{date}} at {{time}}." },
  fr: { body: "Rappel de prise en charge : {{tripId}} à {{pickup}} le {{date}} à {{time}}." },
  es: { body: "Recordatorio de recogida: {{tripId}} en {{pickup}} el {{date}} a las {{time}}." },
  de: { body: "Abholerinnerung: {{tripId}} bei {{pickup}} am {{date}} um {{time}}." },
  nl: { body: "Ophaalherinnering: {{tripId}} bij {{pickup}} op {{date}} om {{time}}." },
  it: { body: "Promemoria ritiro: {{tripId}} presso {{pickup}} il {{date}} alle {{time}}." },
  ru: { body: "Напоминание о подаче: {{tripId}}, {{pickup}}, {{date}} в {{time}}." },
  ar: { body: "تذكير بالالتقاط: {{tripId}} في {{pickup}} يوم {{date}} الساعة {{time}}." },
};

export const partnerSettlementTemplates: LocalizedTemplates = {
  en: { body: "A settlement of {{total}} {{currency}} was recorded on your balance." },
  fr: { body: "Un règlement de {{total}} {{currency}} a été enregistré sur votre solde." },
  es: { body: "Se ha registrado una liquidación de {{total}} {{currency}} en tu saldo." },
  de: { body: "Ein Ausgleich von {{total}} {{currency}} wurde Ihrem Guthaben gutgeschrieben." },
  nl: { body: "Een afrekening van {{total}} {{currency}} is op uw saldo geregistreerd." },
  it: { body: "Un regolamento di {{total}} {{currency}} è stato registrato sul tuo saldo." },
  ru: { body: "На ваш баланс записан расчёт на {{total}} {{currency}}." },
  ar: { body: "تم تسجيل تسوية بمبلغ {{total}} {{currency}} على رصيدك." },
};

export const documentExpiryTemplates: LocalizedTemplates = {
  en: { subject: "Document expiry", body: "Documents expiring within 30 days:\n{{documents}}" },
  fr: { subject: "Expiration de documents", body: "Documents expirant sous 30 jours :\n{{documents}}" },
  es: { subject: "Caducidad de documentos", body: "Documentos que caducan en 30 días:\n{{documents}}" },
  de: { subject: "Ablaufende Dokumente", body: "Dokumente, die in 30 Tagen ablaufen:\n{{documents}}" },
  nl: { subject: "Verlopende documenten", body: "Documenten die binnen 30 dagen verlopen:\n{{documents}}" },
  it: { subject: "Documenti in scadenza", body: "Documenti in scadenza entro 30 giorni:\n{{documents}}" },
  ru: { subject: "Истекающие документы", body: "Документы, истекающие в течение 30 дней:\n{{documents}}" },
  ar: { subject: "انتهاء المستندات", body: "مستندات تنتهي خلال 30 يومًا:\n{{documents}}" },
};
