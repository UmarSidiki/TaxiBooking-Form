import { gsap } from "gsap";
import type { MutableRefObject, RefObject } from "react";

export function playLoginIntroAnimation({
  particlesRef,
  iconRef,
  titleRef,
  subtitleRef,
  cardRef,
  formRef,
  animateFormChildren,
}: {
  particlesRef: MutableRefObject<HTMLDivElement[]>;
  iconRef: RefObject<HTMLDivElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  subtitleRef: RefObject<HTMLParagraphElement | null>;
  cardRef: RefObject<HTMLDivElement | null>;
  formRef: RefObject<HTMLFormElement | null>;
  animateFormChildren: boolean;
}) {
  const tl = gsap.timeline();

  particlesRef.current.forEach((particle, index) => {
    if (particle) {
      gsap.to(particle, {
        y: -20,
        x: Math.random() * 20 - 10,
        opacity: 0,
        duration: 2 + Math.random() * 2,
        repeat: -1,
        delay: index * 0.2,
        ease: "power1.out",
      });
    }
  });

  if (iconRef.current) {
    tl.fromTo(
      iconRef.current,
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)" },
    );
  }

  if (titleRef.current) {
    tl.fromTo(
      titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
      "-=0.5",
    );
  }

  if (subtitleRef.current) {
    tl.fromTo(
      subtitleRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.3",
    );
  }

  if (cardRef.current) {
    tl.fromTo(
      cardRef.current,
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
      "-=0.2",
    );
  }

  if (animateFormChildren && formRef.current) {
    const formElements = Array.from(formRef.current.children);
    tl.fromTo(
      formElements,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
      "-=0.3",
    );
  }

  return () => {
    gsap.killTweensOf("*");
  };
}

export function pulseLoginForm(form: HTMLFormElement | null) {
  gsap.to(form, {
    scale: 0.98,
    duration: 0.2,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
  });
}

export function resetLoginFormPosition(form: HTMLFormElement | null) {
  gsap.fromTo(
    form,
    { x: 0 },
    { x: 0, duration: 0.6, ease: "power2.out" },
  );
}

export function pulseLoginCardThen(
  card: HTMLDivElement | null,
  onComplete: () => void,
) {
  gsap.to(card, {
    scale: 1.05,
    duration: 0.3,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
    onComplete,
  });
}
