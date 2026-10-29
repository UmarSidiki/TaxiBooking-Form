"use client";

import type { SVGProps } from "react";

export type VehicleArtKind = "sedan" | "limo" | "van";

const PARTS: Record<
  VehicleArtKind,
  {
    w: [number, number];
    body: string;
    glass: string[];
    belt: string;
    door: string;
    light: [number, number, number, number][];
  }
> = {
  sedan: {
    w: [58, 186],
    body:
      "M6 57V50c0-4 3-7 10-8l40-5c14-11 30-17 46-18.5 15-1 33-1 46 .5 13 1.5 24 8 35 17l24 3.5c10 1.5 15 5 16 10.5V57c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4z",
    glass: [
      "M66 37c11-8.5 23-13.5 36-14.5l14-.5V37z",
      "M120 22c10 0 20 .3 27 1.3 9 1.4 17 6.5 25 13.7h-52z",
    ],
    belt: "M20 44h196",
    door: "M118 24v32M78 40v16",
    light: [
      [220, 44, 10, 4],
      [8, 45, 7, 4],
    ],
  },
  limo: {
    w: [54, 198],
    body:
      "M4 57V50c0-4 3-7 10-8l42-5c15-12 33-18 52-19.5 18-1 42-1 57 .5 14 1.5 25 8 36 17l24 3.5c9 1.5 13 5 14 10.5V57c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4z",
    glass: [
      "M64 37c12-9 26-14 41-15l20-.4V37z",
      "M129 21.6c14 0 27 .3 36 1.5 10 1.4 18 6.5 27 13.9h-63z",
    ],
    belt: "M18 44h208",
    door: "M127 23v33M88 39v17",
    light: [
      [224, 44, 10, 4],
      [6, 45, 7, 4],
    ],
  },
  van: {
    w: [56, 190],
    body:
      "M6 57V30c0-7 3-12 10-13l146-2c11 0 19 2 26 9l18 15 16 2.5c8 1.3 12 4.5 13 10V57c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4z",
    glass: [
      "M14 21h42v15H14z",
      "M62 20.5h48V36H62z",
      "M116 20h44v16h-44z",
      "M166 19.5c8 0 14 2 19 6.5l12 10h-31z",
    ],
    belt: "M10 42h214",
    door: "M113 20v36M163 20v36",
    light: [
      [222, 42, 10, 4],
      [6, 40, 5, 8],
    ],
  },
};

function wheel(cx: number) {
  return (
    <>
      <circle cx={cx} cy={60} r={16.5} fill="var(--car-arch)" />
      <circle cx={cx} cy={60} r={13.5} fill="var(--car-tyre)" />
      <circle cx={cx} cy={60} r={8.5} fill="var(--car-rim)" />
      <circle cx={cx} cy={60} r={8.5} fill="none" stroke="var(--car-tyre)" strokeWidth={1} strokeDasharray="2.4 3" />
      <circle cx={cx} cy={60} r={2.2} fill="var(--car-tyre)" />
    </>
  );
}

export function VehicleArt({
  kind,
  ...props
}: { kind: VehicleArtKind } & SVGProps<SVGSVGElement>) {
  const p = PARTS[kind];
  return (
    <svg viewBox="0 0 240 78" aria-hidden="true" focusable="false" {...props}>
      <path d="M14 76h212" stroke="var(--rule2)" strokeWidth={1} />
      <path d={p.body} fill="var(--car-body)" />
      {p.glass.map((g) => (
        <path key={g} d={g} fill="var(--car-glass)" />
      ))}
      <path d={p.belt} stroke="var(--car-line)" strokeWidth={1} />
      <path d={p.door} stroke="var(--car-line)" strokeWidth={1} />
      <rect x={p.light[0][0]} y={p.light[0][1]} width={p.light[0][2]} height={p.light[0][3]} rx={1} fill="var(--car-head)" />
      <rect x={p.light[1][0]} y={p.light[1][1]} width={p.light[1][2]} height={p.light[1][3]} rx={1} fill="var(--err)" />
      {p.w.map((cx) => (
        <g key={cx}>{wheel(cx)}</g>
      ))}
    </svg>
  );
}

export function vehicleKindFromVehicle(vehicle: { category?: string; name?: string }): VehicleArtKind {
  const text = `${vehicle.category ?? ""} ${vehicle.name ?? ""}`.toLowerCase();
  if (text.includes("van") || text.includes("suv") || text.includes("bus")) return "van";
  if (text.includes("limo") || text.includes("lux") || text.includes("premium") || text.includes("business")) return "limo";
  return "sedan";
}