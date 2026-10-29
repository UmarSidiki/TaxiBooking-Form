const LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;
export type InvoiceLocale = (typeof LOCALES)[number];

const COPY: Record<InvoiceLocale, Record<string, string>> = {
  en: {
    invoice: "Invoice", billTo: "Bill to", trip: "Trip", from: "From", to: "To", when: "When",
    return: "Return", hours: "Hours", passengers: "Passengers", paid: "Paid", unpaid: "Unpaid",
    partial: "Deposit paid", tax: "Tax", total: "Total", due: "Balance due", dueNow: "Due now",
    deposit: "Deposit", number: "Invoice", pay: "Pay this invoice", footer: "Thank you for riding with us.",
    description: "Description", amount: "Amount", subtotal: "Subtotal",
    cashNote: "Pay the driver in cash, or open the pay page for bank details.",
  },
  fr: {
    invoice: "Facture", billTo: "Facturer à", trip: "Trajet", from: "Départ", to: "Arrivée", when: "Quand",
    return: "Retour", hours: "Heures", passengers: "Passagers", paid: "Payée", unpaid: "Impayée",
    partial: "Acompte reçu", tax: "Taxe", total: "Total", due: "Reste à payer", dueNow: "À payer maintenant",
    deposit: "Acompte", number: "Facture", pay: "Payer cette facture", footer: "Merci d'avoir voyagé avec nous.",
    description: "Description", amount: "Montant", subtotal: "Sous-total",
    cashNote: "Payez le chauffeur en espèces, ou ouvrez la page de paiement pour le virement.",
  },
  es: {
    invoice: "Factura", billTo: "Facturar a", trip: "Viaje", from: "Origen", to: "Destino", when: "Cuándo",
    return: "Regreso", hours: "Horas", passengers: "Pasajeros", paid: "Pagada", unpaid: "Impagada",
    partial: "Depósito pagado", tax: "Impuesto", total: "Total", due: "Saldo pendiente", dueNow: "A pagar ahora",
    deposit: "Depósito", number: "Factura", pay: "Pagar esta factura", footer: "Gracias por viajar con nosotros.",
    description: "Descripción", amount: "Importe", subtotal: "Subtotal",
    cashNote: "Pague al conductor en efectivo, o abra la página de pago para la transferencia.",
  },
  de: {
    invoice: "Rechnung", billTo: "Rechnung an", trip: "Fahrt", from: "Von", to: "Nach", when: "Wann",
    return: "Rückfahrt", hours: "Stunden", passengers: "Fahrgäste", paid: "Bezahlt", unpaid: "Offen",
    partial: "Anzahlung erhalten", tax: "Steuer", total: "Summe", due: "Restbetrag", dueNow: "Jetzt fällig",
    deposit: "Anzahlung", number: "Rechnung", pay: "Diese Rechnung zahlen", footer: "Danke für Ihre Fahrt.",
    description: "Beschreibung", amount: "Betrag", subtotal: "Zwischensumme",
    cashNote: "Zahlen Sie bar beim Fahrer oder öffnen Sie die Zahlseite für die Bankdaten.",
  },
  nl: {
    invoice: "Factuur", billTo: "Factuur aan", trip: "Rit", from: "Van", to: "Naar", when: "Wanneer",
    return: "Terug", hours: "Uren", passengers: "Passagiers", paid: "Betaald", unpaid: "Onbetaald",
    partial: "Aanbetaling ontvangen", tax: "Btw", total: "Totaal", due: "Nog te betalen", dueNow: "Nu te betalen",
    deposit: "Aanbetaling", number: "Factuur", pay: "Betaal deze factuur", footer: "Bedankt voor het meerijden.",
    description: "Omschrijving", amount: "Bedrag", subtotal: "Subtotaal",
    cashNote: "Betaal de chauffeur contant, of open de betaalpagina voor de bankgegevens.",
  },
  it: {
    invoice: "Fattura", billTo: "Fatturare a", trip: "Corsa", from: "Da", to: "A", when: "Quando",
    return: "Ritorno", hours: "Ore", passengers: "Passeggeri", paid: "Pagata", unpaid: "Non pagata",
    partial: "Acconto ricevuto", tax: "Imposta", total: "Totale", due: "Saldo", dueNow: "Da pagare ora",
    deposit: "Acconto", number: "Fattura", pay: "Paga questa fattura", footer: "Grazie per aver viaggiato con noi.",
    description: "Descrizione", amount: "Importo", subtotal: "Imponibile",
    cashNote: "Paga il conducente in contanti, oppure apri la pagina di pagamento per il bonifico.",
  },
  ru: {
    invoice: "Счёт", billTo: "Плательщик", trip: "Поездка", from: "Откуда", to: "Куда", when: "Когда",
    return: "Обратно", hours: "Часы", passengers: "Пассажиры", paid: "Оплачен", unpaid: "Не оплачен",
    partial: "Предоплата получена", tax: "Налог", total: "Итого", due: "Остаток", dueNow: "К оплате сейчас",
    deposit: "Предоплата", number: "Счёт", pay: "Оплатить счёт", footer: "Спасибо, что поехали с нами.",
    description: "Описание", amount: "Сумма", subtotal: "Подытог",
    cashNote: "Оплатите водителю наличными или откройте страницу оплаты для банковских реквизитов.",
  },
  ar: {
    invoice: "فاتورة", billTo: "الفاتورة إلى", trip: "الرحلة", from: "من", to: "إلى", when: "الموعد",
    return: "العودة", hours: "الساعات", passengers: "الركاب", paid: "مدفوعة", unpaid: "غير مدفوعة",
    partial: "العربون مدفوع", tax: "الضريبة", total: "المجموع", due: "المتبقي", dueNow: "المستحق الآن",
    deposit: "العربون", number: "فاتورة", pay: "ادفع هذه الفاتورة", footer: "شكرًا لركوبك معنا.",
    description: "الوصف", amount: "المبلغ", subtotal: "المجموع الفرعي",
    cashNote: "ادفع للسائق نقدًا، أو افتح صفحة الدفع لتحويل المبلغ.",
  },
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

const PAYMENT_METHODS: Record<string, Record<InvoiceLocale, string>> = {
  stripe: { en: "Card", fr: "Carte", es: "Tarjeta", de: "Karte", nl: "Kaart", it: "Carta", ru: "Карта", ar: "بطاقة" },
  card: { en: "Card", fr: "Carte", es: "Tarjeta", de: "Karte", nl: "Kaart", it: "Carta", ru: "Карта", ar: "بطاقة" },
  cash: { en: "Cash", fr: "Espèces", es: "Efectivo", de: "Bargeld", nl: "Contant", it: "Contanti", ru: "Наличные", ar: "نقداً" },
  bank_transfer: { en: "Bank transfer", fr: "Virement", es: "Transferencia", de: "Überweisung", nl: "Overschrijving", it: "Bonifico", ru: "Банковский перевод", ar: "تحويل بنكي" },
  multisafepay: { en: "Card", fr: "Carte", es: "Tarjeta", de: "Karte", nl: "Kaart", it: "Carta", ru: "Карта", ar: "بطاقة" },
};

export function invoicePaymentMethodLabel(method: string | undefined | null, locale?: string | null) {
  const key = String(method ?? "").toLowerCase().trim();
  const map = PAYMENT_METHODS[key] ?? PAYMENT_METHODS.stripe;
  return map?.[invoiceLocale(locale)] ?? method ?? "";
}
