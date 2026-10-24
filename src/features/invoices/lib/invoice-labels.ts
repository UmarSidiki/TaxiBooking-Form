const LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;
export type InvoiceLocale = (typeof LOCALES)[number];

const COPY: Record<InvoiceLocale, Record<string, string>> = {
  en: { invoice: "Invoice", billTo: "Bill to", trip: "Trip", from: "From", to: "To", when: "When", return: "Return", hours: "Hours", passengers: "Passengers", paid: "Paid", unpaid: "Unpaid", tax: "Tax", total: "Total", due: "Balance due", number: "Invoice number", pay: "Pay or download" },
  fr: { invoice: "Facture", billTo: "Facturer à", trip: "Trajet", from: "Départ", to: "Arrivée", when: "Quand", return: "Retour", hours: "Heures", passengers: "Passagers", paid: "Payée", unpaid: "Impayée", tax: "Taxe", total: "Total", due: "Reste à payer", number: "Numéro de facture", pay: "Payer ou télécharger" },
  es: { invoice: "Factura", billTo: "Facturar a", trip: "Viaje", from: "Origen", to: "Destino", when: "Cuándo", return: "Regreso", hours: "Horas", passengers: "Pasajeros", paid: "Pagada", unpaid: "Impagada", tax: "Impuesto", total: "Total", due: "Saldo pendiente", number: "Número de factura", pay: "Pagar o descargar" },
  de: { invoice: "Rechnung", billTo: "Rechnung an", trip: "Fahrt", from: "Von", to: "Nach", when: "Wann", return: "Rückfahrt", hours: "Stunden", passengers: "Fahrgäste", paid: "Bezahlt", unpaid: "Offen", tax: "Steuer", total: "Summe", due: "Restbetrag", number: "Rechnungsnummer", pay: "Zahlen oder herunterladen" },
  nl: { invoice: "Factuur", billTo: "Factuur aan", trip: "Rit", from: "Van", to: "Naar", when: "Wanneer", return: "Terug", hours: "Uren", passengers: "Passagiers", paid: "Betaald", unpaid: "Onbetaald", tax: "Btw", total: "Totaal", due: "Nog te betalen", number: "Factuurnummer", pay: "Betalen of downloaden" },
  it: { invoice: "Fattura", billTo: "Fatturare a", trip: "Corsa", from: "Da", to: "A", when: "Quando", return: "Ritorno", hours: "Ore", passengers: "Passeggeri", paid: "Pagata", unpaid: "Non pagata", tax: "Imposta", total: "Totale", due: "Saldo", number: "Numero fattura", pay: "Paga o scarica" },
  ru: { invoice: "Счёт", billTo: "Плательщик", trip: "Поездка", from: "Откуда", to: "Куда", when: "Когда", return: "Обратно", hours: "Часы", passengers: "Пассажиры", paid: "Оплачен", unpaid: "Не оплачен", tax: "Налог", total: "Итого", due: "К оплате", number: "Номер счёта", pay: "Оплатить или скачать" },
  ar: { invoice: "فاتورة", billTo: "الفاتورة إلى", trip: "الرحلة", from: "من", to: "إلى", when: "الموعد", return: "العودة", hours: "الساعات", passengers: "الركاب", paid: "مدفوعة", unpaid: "غير مدفوعة", tax: "الضريبة", total: "المجموع", due: "المتبقي", number: "رقم الفاتورة", pay: "ادفع أو نزّل" },
};

const LINES: Record<string, Record<InvoiceLocale, string>> = {
  vehicle: { en: "Ride", fr: "Course", es: "Trayecto", de: "Fahrt", nl: "Rit", it: "Corsa", ru: "Поездка", ar: "الرحلة" },
  child_seats: { en: "Child seats", fr: "Sièges enfant", es: "Sillas infantiles", de: "Kindersitze", nl: "Kinderzitjes", it: "Seggiolini", ru: "Детские кресла", ar: "مقاعد أطفال" },
  baby_seats: { en: "Baby seats", fr: "Sièges bébé", es: "Sillas de bebé", de: "Babysitze", nl: "Babyzitjes", it: "Seggiolini neonato", ru: "Люльки", ar: "مقاعد رضع" },
  stops: { en: "Stops", fr: "Arrêts", es: "Paradas", de: "Stopps", nl: "Stops", it: "Fermate", ru: "Остановки", ar: "توقفات" },
  meet_greet: { en: "Meet & greet", fr: "Accueil", es: "Recibimiento", de: "Meet & Greet", nl: "Meet & greet", it: "Accoglienza", ru: "Встреча", ar: "استقبال" },
  night: { en: "Night surcharge", fr: "Supplément nuit", es: "Recargo nocturno", de: "Nachtzuschlag", nl: "Nachttarief", it: "Supplemento notte", ru: "Ночная надбавка", ar: "رسوم ليلية" },
  holiday: { en: "Holiday surcharge", fr: "Supplément férié", es: "Recargo festivo", de: "Feiertagszuschlag", nl: "Feestdagtoeslag", it: "Supplemento festivo", ru: "Праздничная надбавка", ar: "رسوم عطلة" },
  minimum: { en: "Minimum fare", fr: "Tarif minimum", es: "Tarifa mínima", de: "Mindestpreis", nl: "Minimumtarief", it: "Tariffa minima", ru: "Минимальный тариф", ar: "الحد الأدنى" },
  promo: { en: "Discount", fr: "Réduction", es: "Descuento", de: "Rabatt", nl: "Korting", it: "Sconto", ru: "Скидка", ar: "خصم" },
  tax: { en: "Tax", fr: "Taxe", es: "Impuesto", de: "Steuer", nl: "Btw", it: "Imposta", ru: "Налог", ar: "الضريبة" },
};

export function invoiceLocale(value?: string | null): InvoiceLocale {
  return LOCALES.includes(value as InvoiceLocale) ? (value as InvoiceLocale) : "en";
}

export function invoiceCopy(locale?: string | null) {
  return COPY[invoiceLocale(locale)];
}

export function invoiceLineLabel(code: string, locale?: string | null) {
  return LINES[code]?.[invoiceLocale(locale)] ?? code;
}
