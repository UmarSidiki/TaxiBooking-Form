export type AccountLoginFeedback = {
  notice: string | null;
  error: string | null;
  noBooking: boolean;
};

export const initialAccountLoginFeedback: AccountLoginFeedback = {
  notice: null,
  error: null,
  noBooking: false,
};

export type AccountLoginFeedbackAction =
  | { type: "send-started" }
  | { type: "send-succeeded"; notice: string }
  | { type: "send-no-booking" }
  | { type: "send-failed"; error: string }
  | { type: "verify-failed"; error: string }
  | { type: "signed-in" }
  | { type: "email-edited" }
  | { type: "use-different-email" }
  | { type: "set-notice"; notice: string }
  | { type: "reset" };

export function accountLoginFeedbackReducer(
  state: AccountLoginFeedback,
  action: AccountLoginFeedbackAction,
): AccountLoginFeedback {
  switch (action.type) {
    case "send-started":
      return { ...state, error: null, noBooking: false };
    case "send-succeeded":
      return { notice: action.notice, error: null, noBooking: false };
    case "send-no-booking":
      return { notice: null, error: null, noBooking: true };
    case "send-failed":
      return { ...state, error: action.error };
    case "verify-failed":
      return { ...state, error: action.error };
    case "signed-in":
      return initialAccountLoginFeedback;
    case "email-edited":
      return { ...state, noBooking: false, error: null };
    case "use-different-email":
      return initialAccountLoginFeedback;
    case "set-notice":
      return { ...state, notice: action.notice };
    case "reset":
      return initialAccountLoginFeedback;
  }
}
