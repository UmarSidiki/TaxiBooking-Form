export function FareDueRows({
  currencySymbol,
  totalPrice,
  chargeAmount,
  balanceDue,
  dueNowLabel,
  balanceLabel,
}: {
  currencySymbol: string;
  totalPrice: number;
  chargeAmount: number;
  balanceDue: number;
  dueNowLabel: string;
  balanceLabel: string;
}) {
  if (!(balanceDue > 0) || chargeAmount >= totalPrice) return null;
  return (
    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>{dueNowLabel}</span>
        <span className="font-semibold text-foreground">{currencySymbol}{chargeAmount.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>{balanceLabel}</span>
        <span>{currencySymbol}{balanceDue.toFixed(2)}</span>
      </div>
    </div>
  );
}
