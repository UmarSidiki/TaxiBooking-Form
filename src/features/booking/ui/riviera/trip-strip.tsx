"use client";

import { useLocale, useTranslations } from "next-intl";
import { useBookingForm } from "@/features/booking/context/booking-form-context";

export function TripStrip() {
  const t = useTranslations("Riviera");
  const locale = useLocale();
  const { formData, distanceData, setCurrentStep } = useBookingForm();
  const formattedDate = formData.date
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(formData.date))
    : "";
  return (
    <section className="trip" aria-label="Trip summary">
      <div className="rail">
        <span className="dot" />
        <i />
        <span className="dot to" />
      </div>
      <b>{formData.pickup || t("pickup")}</b>
      <div className="meta">
        <span className="num">{distanceData ? `${distanceData.distance.text}` : ""}</span>
        <br />
        <span className="num">{distanceData ? `${distanceData.duration.text}` : ""}</span>
      </div>
      <b>{formData.dropoff || t("dropoff")}</b>
      <div className="when">
        <span>
          {formattedDate} &middot; <span className="num">{formData.time}</span> &middot; {t("passengers", { count: formData.passengers })}
        </span>
        <button type="button" className="edit" onClick={() => setCurrentStep(1)}>
          {t("change")}
        </button>
      </div>
    </section>
  );
}