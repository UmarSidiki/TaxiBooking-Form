import { describe, expect, it } from "vitest";
import {
  accountLoginFeedbackReducer,
  initialAccountLoginFeedback,
} from "@/features/customers/lib/account-login-feedback";

describe("account login feedback", () => {
  it("clears the code-sent notice after a successful sign-in", () => {
    const sent = accountLoginFeedbackReducer(initialAccountLoginFeedback, {
      type: "send-succeeded",
      notice: "Code sent.",
    });
    expect(sent).toEqual({ notice: "Code sent.", error: null, noBooking: false });

    expect(accountLoginFeedbackReducer(sent, { type: "signed-in" })).toEqual(
      initialAccountLoginFeedback,
    );
  });

  it("clears a verify error after a successful sign-in", () => {
    const failed = accountLoginFeedbackReducer(initialAccountLoginFeedback, {
      type: "verify-failed",
      error: "That code is not valid.",
    });
    expect(failed.error).toBe("That code is not valid.");

    expect(accountLoginFeedbackReducer(failed, { type: "signed-in" })).toEqual(
      initialAccountLoginFeedback,
    );
  });

  it("shows no-booking instead of the code-sent notice", () => {
    const sent = accountLoginFeedbackReducer(initialAccountLoginFeedback, {
      type: "send-succeeded",
      notice: "Code sent.",
    });
    const noBooking = accountLoginFeedbackReducer(sent, { type: "send-no-booking" });

    expect(noBooking).toEqual({ notice: null, error: null, noBooking: true });
  });

  it("editing the email clears noBooking so Send code returns", () => {
    const noBooking = accountLoginFeedbackReducer(initialAccountLoginFeedback, {
      type: "send-no-booking",
    });
    const edited = accountLoginFeedbackReducer(
      { ...noBooking, error: "Could not send the code." },
      { type: "email-edited" },
    );

    expect(edited).toEqual({ notice: null, error: null, noBooking: false });
  });

  it("Use a different email clears every login notice", () => {
    const noBooking = accountLoginFeedbackReducer(
      { notice: "Code sent.", error: "Could not send the code.", noBooking: true },
      { type: "use-different-email" },
    );

    expect(noBooking).toEqual(initialAccountLoginFeedback);
  });

  it("clears a previous send error when sending again", () => {
    const failed = accountLoginFeedbackReducer(initialAccountLoginFeedback, {
      type: "send-failed",
      error: "Could not send the code.",
    });
    const retrying = accountLoginFeedbackReducer(failed, { type: "send-started" });

    expect(retrying).toEqual({ notice: null, error: null, noBooking: false });
  });

  it("keeps trip notices for change and cancel results", () => {
    const updated = accountLoginFeedbackReducer(initialAccountLoginFeedback, {
      type: "set-notice",
      notice: "Updated.",
    });
    expect(updated.notice).toBe("Updated.");
  });

  it("reset clears notices on sign-out", () => {
    const updated = accountLoginFeedbackReducer(initialAccountLoginFeedback, {
      type: "set-notice",
      notice: "Updated.",
    });
    expect(accountLoginFeedbackReducer(updated, { type: "reset" })).toEqual(
      initialAccountLoginFeedback,
    );
  });
});
