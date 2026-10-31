"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { RoleToggle } from "@/components/auth/RoleToggle";
import { TextField } from "@/components/auth/TextField";

type Role = "patient" | "pharmacy";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");

  return (
    <main className="flex min-h-screen flex-col bg-white font-sans text-ink-900 lg:flex-row">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="w-full max-w-[430px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-ink-900">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">Log in to search for medicines near you.</p>
          </div>

          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <RoleToggle value={role} onChange={setRole} />
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
            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Forgot password?
              </button>
            </div>
            <button type="submit" className="w-full rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700">
              Log in
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
