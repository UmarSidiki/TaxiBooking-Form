"use client";

import { useTranslations } from "next-intl";
import { useBookingForm } from "@/features/booking/context/booking-form-context";

export function TripStrip() {
  const t = useTranslations("Riviera");
  const { formData, distanceData, setCurrentStep } = useBookingForm();
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
          {formData.date} &middot; <span className="num">{formData.time}</span> &middot; {formData.passengers} {t("passengers")}
        </span>
        <button type="button" className="edit" onClick={() => setCurrentStep(1)}>
          {t("change")}
        </button>
      </div>
    </section>
  );
}