import { RidePayDesk } from "@/features/invoices/ui/ride-pay-desk";

type Params = { params: Promise<{ token: string }> };

export default async function RidePayPage({ params }: Params) {
  const { token } = await params;
  return <RidePayDesk token={token} />;
}
