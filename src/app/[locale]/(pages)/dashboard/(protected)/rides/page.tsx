import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function RidesPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <div className="flex items-center gap-4 border-b p-4">
        <h1 className="text-3xl font-semibold">Rides</h1>
      </div>
      <section className="space-y-6 px-6 py-8">
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}. You are signed in as{" "}
          {session?.user?.email}.
        </p>
      </section>
    </>
  );
}
