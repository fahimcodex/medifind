"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { RoleCards } from "@/components/auth/RoleCards";
import { TextField } from "@/components/auth/TextField";

type Role = "patient" | "pharmacy";

export default function SignupPage() {
  const [role, setRole] = useState<Role>("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="flex min-h-screen flex-col bg-white font-sans text-ink-900 lg:flex-row">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="w-full max-w-[430px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-ink-900">Create your free account.</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">Choose how you&apos;ll use MediFind to get started.</p>
          </div>

          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
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
            <button
              type="submit"
              className="w-full rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              Create account
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
