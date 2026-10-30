import { describe, expect, it } from "vitest";
import { contrastWithWhite, operatorAccent } from "@/features/settings/lib/operator-accent";

describe("operatorAccent", () => {
  it("treats empty, malformed and the schema default as not customised", () => {
    expect(operatorAccent(undefined)).toEqual({ kind: "default" });
    expect(operatorAccent("teal")).toEqual({ kind: "default" });
    expect(operatorAccent("#b45309")).toEqual({ kind: "default" });
  });

  it("accepts a colour that keeps white text at AA", () => {
    expect(operatorAccent("#1F4E79")).toEqual({ kind: "custom", color: "#1F4E79" });
  });

  it("rejects a colour too light for white text", () => {
    const verdict = operatorAccent("#F5C542");
    expect(verdict.kind).toBe("too-light");
  });

  it("computes contrast against white", () => {
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 0);
    expect(contrastWithWhite("#FFFFFF")).toBeCloseTo(1, 5);
  });
});
