const LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;
type Locale = (typeof LOCALES)[number];

const COPY: Record<Locale, Record<string, string>> = {
  en: { title: "Monthly statement", account: "Account", period: "Period", trip: "Trip", when: "When", route: "Route", amount: "Amount", total: "Total due", footer: "This statement covers completed and upcoming rides for the month." },
  fr: { title: "Relevé mensuel", account: "Compte", period: "Période", trip: "Course", when: "Quand", route: "Trajet", amount: "Montant", total: "Total dû", footer: "Ce relevé couvre les courses du mois." },
  es: { title: "Extracto mensual", account: "Cuenta", period: "Periodo", trip: "Viaje", when: "Cuándo", route: "Ruta", amount: "Importe", total: "Total pendiente", footer: "Este extracto cubre los viajes del mes." },
  de: { title: "Monatsabrechnung", account: "Konto", period: "Zeitraum", trip: "Fahrt", when: "Wann", route: "Strecke", amount: "Betrag", total: "Summe", footer: "Diese Abrechnung umfasst die Fahrten des Monats." },
  nl: { title: "Maandoverzicht", account: "Account", period: "Periode", trip: "Rit", when: "Wanneer", route: "Route", amount: "Bedrag", total: "Totaal", footer: "Dit overzicht dekt de ritten van de maand." },
  it: { title: "Estratto mensile", account: "Account", period: "Periodo", trip: "Corsa", when: "Quando", route: "Tratta", amount: "Importo", total: "Totale", footer: "Questo estratto copre le corse del mese." },
  ru: { title: "Месячный отчёт", account: "Счёт", period: "Период", trip: "Поездка", when: "Когда", route: "Маршрут", amount: "Сумма", total: "Итого", footer: "Отчёт включает поездки за месяц." },
  ar: { title: "كشف شهري", account: "الحساب", period: "الفترة", trip: "الرحلة", when: "الموعد", route: "المسار", amount: "المبلغ", total: "المجموع", footer: "يغطي هذا الكشف رحلات الشهر." },
};

export function statementCopy(locale?: string | null) {
  return COPY[LOCALES.includes(locale as Locale) ? (locale as Locale) : "en"];
}
