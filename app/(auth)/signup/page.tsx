"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { RoleCards } from "@/components/auth/RoleCards";
import { TextField } from "@/components/auth/TextField";
import { createClient } from "@/lib/supabase/client";

type Role = "patient" | "pharmacy";

export default function SignupPage() {
  const [role, setRole] = useState<Role>("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Account created. Check your email to confirm your account.");
      setPassword("");
      setConfirmPassword("");
    }

    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen flex-col bg-white font-sans text-ink-900 lg:flex-row">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="w-full max-w-[430px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-ink-900">Create your free account.</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">Choose how you&apos;ll use MediFind to get started.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <RoleCards value={role} onChange={setRole} />
            <TextField
              id="full-name"
              label="Full name"
              value={fullName}
              placeholder="John Doe"
              onChange={setFullName}
            />
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
              placeholder="Create a password"
              onChange={setPassword}
            />
            <TextField
              id="confirm-password"
              label="Confirm password"
              type="password"
              value={confirmPassword}
              placeholder="Re-enter your password"
              onChange={setConfirmPassword}
            />
            {errorMessage ? (
              <p role="alert" className="text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p role="status" className="text-sm text-green-700">
                {successMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
