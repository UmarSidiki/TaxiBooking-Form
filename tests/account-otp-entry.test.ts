import { describe, expect, it } from "vitest";
import {
  compactOtp,
  digitsOnly,
  mergeOtpEntry,
  otpDisplayValue,
  otpFocusAfterKey,
  setOtpDigit,
} from "@/features/customers/lib/otp-entry";

describe("OTP entry", () => {
  it("keeps only digits", () => {
    expect(digitsOnly(" 12-34 56 ")).toBe("123456");
    expect(digitsOnly("abc")).toBe("");
  });

  it("types one digit, stores it in the current slot and advances", () => {
    expect(mergeOtpEntry("", 0, "1")).toEqual({
      value: "1     ",
      focusIndex: 1,
    });
    expect(mergeOtpEntry("12    ", 2, "3")).toEqual({
      value: "123   ",
      focusIndex: 3,
    });
  });

  it("spreads a pasted or autofilled code across the six slots", () => {
    expect(mergeOtpEntry("", 0, "123456")).toEqual({
      value: "123456",
      focusIndex: 5,
    });
  });

  it("keeps a digit in the slot the rider tapped", () => {
    expect(mergeOtpEntry("", 4, "5")).toEqual({
      value: "    5 ",
      focusIndex: 5,
    });
  });

  it("clears one slot without moving the others", () => {
    expect(setOtpDigit("123456", 2, "")).toBe("12 456");
    expect(setOtpDigit("123456", 2, "9")).toBe("129456");
  });

  it("renders blanks for empty slots", () => {
    expect(otpDisplayValue("12    ", 1)).toBe("2");
    expect(otpDisplayValue("12    ", 2)).toBe("");
  });

  it("moves focus with arrows and backspace on an empty slot", () => {
    expect(otpFocusAfterKey("12    ", 2, "Backspace")).toBe(1);
    expect(otpFocusAfterKey("123456", 2, "Backspace")).toBe(2);
    expect(otpFocusAfterKey("123456", 2, "ArrowLeft")).toBe(1);
    expect(otpFocusAfterKey("123456", 5, "ArrowRight")).toBe(5);
    expect(otpFocusAfterKey("123456", 0, "ArrowLeft")).toBe(0);
  });

  it("sends the code without slot padding", () => {
    expect(compactOtp("12 456")).toBe("12456");
    expect(compactOtp("123456")).toBe("123456");
  });
});
