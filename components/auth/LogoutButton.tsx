"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/supabase/auth";

export function LogoutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setErrorMessage("");

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log out.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Log out
      </button>
      {errorMessage ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
