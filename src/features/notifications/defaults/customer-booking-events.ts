import type { LocalizedTemplates } from "@/features/notifications/notification-types";

export const bookingConfirmedTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, your ride {{tripId}} is confirmed for {{date}} at {{time}}. Pickup: {{pickup}}. Total: {{total}}." },
  fr: { body: "Bonjour {{name}}, votre course {{tripId}} est confirmée le {{date}} à {{time}}. Prise en charge : {{pickup}}. Total : {{total}}." },
  es: { body: "Hola {{name}}, tu viaje {{tripId}} está confirmado para el {{date}} a las {{time}}. Recogida: {{pickup}}. Total: {{total}}." },
  de: { body: "Hallo {{name}}, Ihre Fahrt {{tripId}} ist am {{date}} um {{time}} bestätigt. Abholung: {{pickup}}. Summe: {{total}}." },
  nl: { body: "Hallo {{name}}, uw rit {{tripId}} is bevestigd op {{date}} om {{time}}. Ophalen: {{pickup}}. Totaal: {{total}}." },
  it: { body: "Ciao {{name}}, la tua corsa {{tripId}} è confermata per il {{date}} alle {{time}}. Ritiro: {{pickup}}. Totale: {{total}}." },
  ru: { body: "Здравствуйте, {{name}}! Поездка {{tripId}} подтверждена на {{date}} в {{time}}. Подача: {{pickup}}. Итого: {{total}}." },
  ar: { body: "مرحبًا {{name}}، تم تأكيد رحلتك {{tripId}} في {{date}} الساعة {{time}}. الالتقاط: {{pickup}}. المجموع: {{total}}." },
};

export const bookingCancelledTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, ride {{tripId}} has been cancelled." },
  fr: { body: "Bonjour {{name}}, la course {{tripId}} a été annulée." },
  es: { body: "Hola {{name}}, el viaje {{tripId}} ha sido cancelado." },
  de: { body: "Hallo {{name}}, die Fahrt {{tripId}} wurde storniert." },
  nl: { body: "Hallo {{name}}, rit {{tripId}} is geannuleerd." },
  it: { body: "Ciao {{name}}, la corsa {{tripId}} è stata annullata." },
  ru: { body: "Здравствуйте, {{name}}! Поездка {{tripId}} отменена." },
  ar: { body: "مرحبًا {{name}}، تم إلغاء الرحلة {{tripId}}." },
};

export const bookingChangedTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, ride {{tripId}} was updated: {{pickup}} on {{date}} at {{time}}." },
  fr: { body: "Bonjour {{name}}, la course {{tripId}} a été modifiée : {{pickup}} le {{date}} à {{time}}." },
  es: { body: "Hola {{name}}, el viaje {{tripId}} se ha actualizado: {{pickup}} el {{date}} a las {{time}}." },
  de: { body: "Hallo {{name}}, die Fahrt {{tripId}} wurde geändert: {{pickup}} am {{date}} um {{time}}." },
  nl: { body: "Hallo {{name}}, rit {{tripId}} is gewijzigd: {{pickup}} op {{date}} om {{time}}." },
  it: { body: "Ciao {{name}}, la corsa {{tripId}} è stata modificata: {{pickup}} il {{date}} alle {{time}}." },
  ru: { body: "Здравствуйте, {{name}}! Поездка {{tripId}} изменена: {{pickup}}, {{date}} в {{time}}." },
  ar: { body: "مرحبًا {{name}}، تم تحديث الرحلة {{tripId}}: {{pickup}} في {{date}} الساعة {{time}}." },
};

export const requestReceivedTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, we received your request {{tripId}}. We will confirm the price shortly." },
  fr: { body: "Bonjour {{name}}, nous avons reçu votre demande {{tripId}}. Nous confirmerons le prix rapidement." },
  es: { body: "Hola {{name}}, recibimos tu solicitud {{tripId}}. Confirmaremos el precio en breve." },
  de: { body: "Hallo {{name}}, wir haben Ihre Anfrage {{tripId}} erhalten. Wir bestätigen den Preis in Kürze." },
  nl: { body: "Hallo {{name}}, we hebben uw aanvraag {{tripId}} ontvangen. We bevestigen de prijs zo snel mogelijk." },
  it: { body: "Ciao {{name}}, abbiamo ricevuto la tua richiesta {{tripId}}. Confermeremo il prezzo a breve." },
  ru: { body: "Здравствуйте, {{name}}! Мы получили заявку {{tripId}}. Скоро подтвердим цену." },
  ar: { body: "مرحبًا {{name}}، تلقينا طلبك {{tripId}}. سنؤكد السعر قريبًا." },
};

export const requestDeclinedTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, we cannot fulfil request {{tripId}}. Reason: {{reason}}." },
  fr: { body: "Bonjour {{name}}, nous ne pouvons pas donner suite à la demande {{tripId}}. Motif : {{reason}}." },
  es: { body: "Hola {{name}}, no podemos atender la solicitud {{tripId}}. Motivo: {{reason}}." },
  de: { body: "Hallo {{name}}, wir können die Anfrage {{tripId}} nicht erfüllen. Grund: {{reason}}." },
  nl: { body: "Hallo {{name}}, we kunnen aanvraag {{tripId}} niet uitvoeren. Reden: {{reason}}." },
  it: { body: "Ciao {{name}}, non possiamo evadere la richiesta {{tripId}}. Motivo: {{reason}}." },
  ru: { body: "Здравствуйте, {{name}}! Мы не можем выполнить заявку {{tripId}}. Причина: {{reason}}." },
  ar: { body: "مرحبًا {{name}}، لا يمكننا تنفيذ الطلب {{tripId}}. السبب: {{reason}}." },
};

export const quotePayLinkTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, your quote for ride {{tripId}} is ready. Pay here: {{payUrl}}" },
  fr: { body: "Bonjour {{name}}, votre devis pour la course {{tripId}} est prêt. Payez ici : {{payUrl}}" },
  es: { body: "Hola {{name}}, tu presupuesto para el viaje {{tripId}} está listo. Paga aquí: {{payUrl}}" },
  de: { body: "Hallo {{name}}, Ihr Angebot für Fahrt {{tripId}} ist bereit. Hier bezahlen: {{payUrl}}" },
  nl: { body: "Hallo {{name}}, uw prijsopgave voor rit {{tripId}} is klaar. Betaal hier: {{payUrl}}" },
  it: { body: "Ciao {{name}}, il preventivo per la corsa {{tripId}} è pronto. Paga qui: {{payUrl}}" },
  ru: { body: "Здравствуйте, {{name}}! Ваше предложение по поездке {{tripId}} готово. Оплатить: {{payUrl}}" },
  ar: { body: "مرحبًا {{name}}، عرض السعر للرحلة {{tripId}} جاهز. ادفع هنا: {{payUrl}}" },
};

export const thankYouTemplates: LocalizedTemplates = {
  en: { body: "Thank you for riding with us, {{name}}. Leave a review: {{reviewUrl}}" },
  fr: { body: "Merci d'avoir voyagé avec nous, {{name}}. Laissez un avis : {{reviewUrl}}" },
  es: { body: "Gracias por viajar con nosotros, {{name}}. Deja una reseña: {{reviewUrl}}" },
  de: { body: "Danke für Ihre Fahrt, {{name}}. Hinterlassen Sie eine Bewertung: {{reviewUrl}}" },
  nl: { body: "Bedankt voor het meerijden, {{name}}. Laat een beoordeling achter: {{reviewUrl}}" },
  it: { body: "Grazie per aver viaggiato con noi, {{name}}. Lascia una recensione: {{reviewUrl}}" },
  ru: { body: "Спасибо, что поехали с нами, {{name}}. Оставьте отзыв: {{reviewUrl}}" },
  ar: { body: "شكرًا لركوبك معنا، {{name}}. اترك تقييمًا: {{reviewUrl}}" },
};

export const customerPickupReminderTemplates: LocalizedTemplates = {
  en: { body: "Hello {{name}}, reminder: your ride {{tripId}} is on {{date}} at {{time}}, pickup {{pickup}}." },
  fr: { body: "Bonjour {{name}}, rappel : votre course {{tripId}} est le {{date}} à {{time}}, prise en charge {{pickup}}." },
  es: { body: "Hola {{name}}, recordatorio: tu viaje {{tripId}} es el {{date}} a las {{time}}, recogida {{pickup}}." },
  de: { body: "Hallo {{name}}, Erinnerung: Ihre Fahrt {{tripId}} ist am {{date}} um {{time}}, Abholung {{pickup}}." },
  nl: { body: "Hallo {{name}}, herinnering: uw rit {{tripId}} is op {{date}} om {{time}}, ophalen {{pickup}}." },
  it: { body: "Ciao {{name}}, promemoria: la tua corsa {{tripId}} è il {{date}} alle {{time}}, ritiro {{pickup}}." },
  ru: { body: "Здравствуйте, {{name}}! Напоминание: поездка {{tripId}} {{date}} в {{time}}, подача {{pickup}}." },
  ar: { body: "مرحبًا {{name}}، تذكير: رحلتك {{tripId}} في {{date}} الساعة {{time}}، الالتقاط {{pickup}}." },
};
