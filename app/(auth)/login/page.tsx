"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { TextField } from "@/components/auth/TextField";
import { createClient } from "@/lib/supabase/client";

type UserRole = "patient" | "pharmacy" | "admin";

function isUserRole(role: unknown): role is UserRole {
  return role === "patient" || role === "pharmacy" || role === "admin";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.user) {
      setErrorMessage("Unable to determine the signed-in user.");
      setIsSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      setErrorMessage(profileError.message);
      setIsSubmitting(false);
      return;
    }

    const role = isUserRole(profile.role) ? profile.role : null;
    const destination =
      role === "patient"
        ? "/search"
        : role === "pharmacy"
          ? "/pharmacy/dashboard"
          : role === "admin"
            ? "/admin"
            : null;

    if (!destination) {
      setErrorMessage("Your account does not have a supported role.");
      setIsSubmitting(false);
      return;
    }

    router.replace(destination);
  }

  return (
    <main className="flex min-h-screen flex-col bg-white font-sans text-ink-900 lg:flex-row">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="w-full max-w-[430px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-ink-900">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">Log in to search for medicines near you.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextField
              id="email"
              label="Email"
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={setEmail}
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={setPassword}
            />
            {errorMessage ? (
              <p role="alert" className="text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
