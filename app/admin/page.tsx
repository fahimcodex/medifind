import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-white font-sans text-ink-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <p className="mt-2 text-ink-600">Admin tools will be available here soon.</p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
