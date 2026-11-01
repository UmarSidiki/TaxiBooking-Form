import { CustomerProfilePage } from "@/features/customers-admin/ui/customer-profile-page";

export default async function DashboardCustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerProfilePage id={id} />;
}
