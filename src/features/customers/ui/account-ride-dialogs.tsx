import type { AccountT } from "./account-types";
import { ChangeTripDialog } from "./change-trip-dialog";
import { CancelTripDialog } from "./cancel-trip-dialog";
import type { useAccountRideActions } from "../hooks/use-account-ride-actions";

type Actions = ReturnType<typeof useAccountRideActions>;

export function AccountRideDialogs({
  t,
  locale,
  actions,
}: {
  t: AccountT;
  locale: string;
  actions: Actions;
}) {
  return (
    <>
      <ChangeTripDialog
        open={actions.changeOpen}
        onOpenChange={actions.setChangeOpen}
        ride={actions.selected}
        t={t}
        onSubmit={actions.handleChange}
        submitting={actions.submitting}
        result={actions.changeResult}
      />
      <CancelTripDialog
        open={actions.cancelOpen}
        onOpenChange={actions.setCancelOpen}
        ride={actions.selected}
        t={t}
        locale={locale}
        onConfirm={actions.handleCancel}
        submitting={actions.submitting}
      />
    </>
  );
}
