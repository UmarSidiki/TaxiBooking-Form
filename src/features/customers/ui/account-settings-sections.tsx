import type { AccountT, CustomerProfile } from "./account-types";
import { AccountProfile } from "./account-profile";
import { AccountSecurity } from "./account-security";

export function AccountSettingsSections({
  t,
  profile,
  onProfileSaved,
  onSignOutEverywhere,
}: {
  t: AccountT;
  profile: CustomerProfile | null;
  onProfileSaved: (profile: CustomerProfile) => void;
  onSignOutEverywhere: () => void;
}) {
  return (
    <div className="mt-4 grid gap-4 md:mt-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <section
        id="profile"
        className="scroll-mt-24 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-4 md:p-5"
      >
        <AccountProfile t={t} profile={profile} onSaved={onProfileSaved} />
      </section>
      <AccountSecurity t={t} onSignOutEverywhere={onSignOutEverywhere} />
    </div>
  );
}
