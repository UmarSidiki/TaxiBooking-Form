import type { LocalizedTemplates } from "@/features/notifications/notification-types";

export const driverAssignedTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, {{driver}} will drive you in {{vehicle}} ({{plate}}) for ride {{tripId}}. Track it: {{statusUrl}}" },
  fr: { body: "Bonjour {{name}}, {{driver}} vous conduira en {{vehicle}} ({{plate}}) pour la course {{tripId}}. Suivre : {{statusUrl}}" },
  es: { body: "Hola {{name}}, {{driver}} te llevará en {{vehicle}} ({{plate}}) para el viaje {{tripId}}. Sigue: {{statusUrl}}" },
  de: { body: "Hallo {{name}}, {{driver}} fährt Sie in {{vehicle}} ({{plate}}) für Fahrt {{tripId}}. Verfolgen: {{statusUrl}}" },
  nl: { body: "Hallo {{name}}, {{driver}} rijdt u in {{vehicle}} ({{plate}}) voor rit {{tripId}}. Volgen: {{statusUrl}}" },
  it: { body: "Ciao {{name}}, {{driver}} ti accompagnerà in {{vehicle}} ({{plate}}) per la corsa {{tripId}}. Segui: {{statusUrl}}" },
  ru: { body: "Здравствуйте, {{name}}! {{driver}} повезёт вас на {{vehicle}} ({{plate}}), поездка {{tripId}}. Отследить: {{statusUrl}}" },
  ar: { body: "مرحبًا {{name}}، سيقودك {{driver}} في {{vehicle}} ({{plate}}) للرحلة {{tripId}}. تابع: {{statusUrl}}" },
};

export const onTheWayTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, your driver is on the way for ride {{tripId}}. Track it: {{statusUrl}}" },
  fr: { body: "Bonjour {{name}}, votre chauffeur est en route pour la course {{tripId}}. Suivre : {{statusUrl}}" },
  es: { body: "Hola {{name}}, tu conductor está en camino para el viaje {{tripId}}. Sigue: {{statusUrl}}" },
  de: { body: "Hallo {{name}}, Ihr Fahrer ist unterwegs für Fahrt {{tripId}}. Verfolgen: {{statusUrl}}" },
  nl: { body: "Hallo {{name}}, uw chauffeur is onderweg voor rit {{tripId}}. Volgen: {{statusUrl}}" },
  it: { body: "Ciao {{name}}, il tuo conducente è in arrivo per la corsa {{tripId}}. Segui: {{statusUrl}}" },
  ru: { body: "Здравствуйте, {{name}}! Водитель в пути, поездка {{tripId}}. Отследить: {{statusUrl}}" },
  ar: { body: "مرحبًا {{name}}، السائق في الطريق للرحلة {{tripId}}. تابع: {{statusUrl}}" },
};

export const arrivedTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, your driver has arrived for ride {{tripId}}." },
  fr: { body: "Bonjour {{name}}, votre chauffeur est arrivé pour la course {{tripId}}." },
  es: { body: "Hola {{name}}, tu conductor ha llegado para el viaje {{tripId}}." },
  de: { body: "Hallo {{name}}, Ihr Fahrer ist für Fahrt {{tripId}} angekommen." },
  nl: { body: "Hallo {{name}}, uw chauffeur is aangekomen voor rit {{tripId}}." },
  it: { body: "Ciao {{name}}, il tuo conducente è arrivato per la corsa {{tripId}}." },
  ru: { body: "Здравствуйте, {{name}}! Водитель прибыл, поездка {{tripId}}." },
  ar: { body: "مرحبًا {{name}}، وصل السائق للرحلة {{tripId}}." },
};

export const completedTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, ride {{tripId}} is complete. Thank you for riding with us." },
  fr: { body: "Bonjour {{name}}, la course {{tripId}} est terminée. Merci d'avoir voyagé avec nous." },
  es: { body: "Hola {{name}}, el viaje {{tripId}} ha terminado. Gracias por viajar con nosotros." },
  de: { body: "Hallo {{name}}, Fahrt {{tripId}} ist abgeschlossen. Danke für Ihre Fahrt." },
  nl: { body: "Hallo {{name}}, rit {{tripId}} is voltooid. Bedankt voor het meerijden." },
  it: { body: "Ciao {{name}}, la corsa {{tripId}} è completata. Grazie per aver viaggiato con noi." },
  ru: { body: "Здравствуйте, {{name}}! Поездка {{tripId}} завершена. Спасибо, что поехали с нами." },
  ar: { body: "مرحبًا {{name}}، اكتملت الرحلة {{tripId}}. شكرًا لركوبك معنا." },
};

export const invoiceNoticeTemplates: LocalizedTemplates = {
  en: { subject: "Invoice {{invoiceNumber}}", body: "Hello {{name}}, invoice {{invoiceNumber}} for ride {{tripId}} is attached. Total: {{total}}." },
  fr: { subject: "Facture {{invoiceNumber}}", body: "Bonjour {{name}}, la facture {{invoiceNumber}} pour la course {{tripId}} est jointe. Total : {{total}}." },
  es: { subject: "Factura {{invoiceNumber}}", body: "Hola {{name}}, adjuntamos la factura {{invoiceNumber}} del viaje {{tripId}}. Total: {{total}}." },
  de: { subject: "Rechnung {{invoiceNumber}}", body: "Hallo {{name}}, die Rechnung {{invoiceNumber}} für Fahrt {{tripId}} ist beigefügt. Summe: {{total}}." },
  nl: { subject: "Factuur {{invoiceNumber}}", body: "Hallo {{name}}, factuur {{invoiceNumber}} voor rit {{tripId}} is bijgevoegd. Totaal: {{total}}." },
  it: { subject: "Fattura {{invoiceNumber}}", body: "Ciao {{name}}, la fattura {{invoiceNumber}} per la corsa {{tripId}} è allegata. Totale: {{total}}." },
  ru: { subject: "Счёт {{invoiceNumber}}", body: "Здравствуйте, {{name}}! Счёт {{invoiceNumber}} по поездке {{tripId}} приложен. Итого: {{total}}." },
  ar: { subject: "فاتورة {{invoiceNumber}}", body: "مرحبًا {{name}}، الفاتورة {{invoiceNumber}} للرحلة {{tripId}} مرفقة. المجموع: {{total}}." },
};

export const signInOtpTemplates: LocalizedTemplates = {
  en: { subject: "Your sign-in code", body: "Your sign-in code is {{code}}. It expires in 10 minutes." },
  fr: { subject: "Votre code de connexion", body: "Votre code de connexion est {{code}}. Il expire dans 10 minutes." },
  es: { subject: "Tu código de acceso", body: "Tu código de acceso es {{code}}. Caduca en 10 minutos." },
  de: { subject: "Ihr Anmeldecode", body: "Ihr Anmeldecode lautet {{code}}. Er läuft in 10 Minuten ab." },
  nl: { subject: "Uw inlogcode", body: "Uw inlogcode is {{code}}. Deze verloopt over 10 minuten." },
  it: { subject: "Il tuo codice di accesso", body: "Il tuo codice di accesso è {{code}}. Scade tra 10 minuti." },
  ru: { subject: "Ваш код входа", body: "Ваш код входа — {{code}}. Он действует 10 минут." },
  ar: { subject: "رمز تسجيل الدخول", body: "رمز تسجيل الدخول هو {{code}}. ينتهي خلال 10 دقائق." },
};
