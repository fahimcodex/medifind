import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const links = [
  ["Find Medicine", "#find-medicine"],
  ["Pharmacies", "#pharmacies"],
  ["How it works", "#how-it-works"],
  ["For Pharmacies", "#for-pharmacies"],
];

type UserRole = "patient" | "pharmacy" | "admin";
type Profile = {
  full_name: string | null;
  role: UserRole;
};

async function signOut() {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Unable to log out.", { cause: error });
  }

  redirect("/");
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

export async function Navbar() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error("Unable to load the current user.", { cause: userError });
  }

  const user = userData.user;
  let profile: Profile | null = null;

  if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error("Unable to load account details.", { cause: profileError });
    }

    profile = data as Profile | null;
  }

  const displayName = profile?.full_name?.trim() || user?.email || "User";

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="MediFind home">
          <span className="grid size-9 place-items-center rounded-[10px] bg-primary-600 text-xl font-semibold text-white">+</span>
          <span className="text-[21px] font-bold tracking-[-0.03em]">MediFind</span>
        </Link>
        <nav className="hidden items-center gap-10 text-[15px] font-medium text-ink-600 lg:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-primary-600">{label}</a>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            {profile?.role === "patient" ? (
              <Link href="/reservations" className="hidden rounded-lg px-3 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-primary-50 hover:text-primary-600 sm:block">
                My Reservations
              </Link>
            ) : null}
            {profile?.role === "pharmacy" ? (
              <Link href="/pharmacy/dashboard" className="hidden rounded-lg px-3 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-primary-50 hover:text-primary-600 sm:block">
                Dashboard
              </Link>
            ) : null}
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-primary-50 text-sm font-bold text-primary-600" aria-hidden="true">
                {getInitials(displayName)}
              </span>
              <span className="hidden max-w-32 truncate text-sm font-semibold text-ink-700 sm:block">{displayName}</span>
            </div>
            <form action={signOut}>
              <button type="submit" className="rounded-lg px-3 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-primary-50 hover:text-primary-600">
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-primary-50 hover:text-primary-600">
              Log in
            </Link>
            <Link href="/signup" className="rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
