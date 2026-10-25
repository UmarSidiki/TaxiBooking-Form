import { existsSync } from "node:fs";
import { join } from "node:path";
import { Font } from "@react-pdf/renderer";

const dir = join(process.cwd(), "src/features/invoices/fonts");
let registered = false;

export function registerInvoiceFonts() {
  if (registered) return;
  const regular = join(dir, "DejaVuSans.ttf");
  const bold = join(dir, "DejaVuSans-Bold.ttf");
  const arabic = join(dir, "NotoNaskhArabic-Regular.ttf");
  const arabicBold = join(dir, "NotoNaskhArabic-Bold.ttf");
  if (existsSync(regular) && existsSync(bold)) {
    Font.register({ family: "Invoice", fonts: [{ src: regular }, { src: bold, fontWeight: 700 }] });
  }
  if (existsSync(arabic) && existsSync(arabicBold)) {
    Font.register({
      family: "InvoiceArabic",
      fonts: [{ src: arabic }, { src: arabicBold, fontWeight: 700 }],
    });
  }
  registered = true;
}

export function invoiceFontFamily(locale?: string | null) {
  registerInvoiceFonts();
  return locale === "ar" ? "InvoiceArabic" : "Invoice";
}
