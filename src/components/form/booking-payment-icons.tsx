"use client";

import Image from "next/image";

const BOOKING_PAYMENT_ICONS = [
  { src: "/visa.webp", alt: "Visa" },
  { src: "/mastercard.webp", alt: "MasterCard" },
  { src: "/paypal.webp", alt: "PayPal" },
  { src: "/twint.webp", alt: "Twint" },
  { src: "/applepay.webp", alt: "Apple Pay" },
] as const;

export function BookingPaymentIcons({
  className,
  imageClassName,
}: {
  className: string;
  imageClassName: string;
}) {
  return (
    <div className={className}>
      {BOOKING_PAYMENT_ICONS.map((icon) => (
        <Image
          key={icon.src}
          src={icon.src}
          alt={icon.alt}
          width={35}
          height={25}
          className={imageClassName}
        />
      ))}
    </div>
  );
}
