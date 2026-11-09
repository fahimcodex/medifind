"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
      className="flex w-full items-center gap-2 rounded-xl border border-line bg-background p-2 text-sm text-ink-400 focus-within:border-primary-600"
      role="search"
    >
      <div className="flex min-w-0 flex-1 items-center px-4 py-3">
        <input
          aria-label="Search medicines"
          className="min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-400"
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by brand or generic name"
          value={query}
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-background transition-colors hover:bg-primary-700"
      >
        Search
      </button>
    </form>
  );
}
