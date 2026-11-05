"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

type SearchBarProps = {
  initialQuery?: string;
};

export function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();
    if (!value) {
      router.push("/search");
      return;
    }

    router.push(`/search?${new URLSearchParams({ q: value }).toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-400 shadow-sm focus-within:border-primary-600"
      role="search"
    >
      <SearchIcon />
      <input
        aria-label="Search medicines"
        className="min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-400"
        name="q"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by brand or generic name"
        value={query}
      />
      <button
        type="submit"
        className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-700"
      >
        Search
      </button>
    </form>
  );
}
