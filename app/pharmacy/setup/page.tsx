import { PharmacySetupForm } from "@/components/pharmacy/PharmacySetupForm";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PharmacySetupPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load pharmacy setup profile.", error);
    throw new Error("Unable to load account details.", { cause: error });
  }
  if (profile?.role !== "pharmacy") redirect("/search");

  return (
    <main className="min-h-screen bg-surface px-5 py-10 font-sans text-ink-900 sm:px-8">
      <section className="mx-auto max-w-2xl rounded-xl border border-line bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-primary-600">MediFind pharmacy</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Set up your pharmacy</h1>
        <p className="mt-2 text-sm leading-6 text-ink-600">Submit your details for admin approval. Customers can find your pharmacy after it is approved.</p>
        <div className="mt-7">
          <PharmacySetupForm />
        </div>
      </section>
    </main>
  );
}
