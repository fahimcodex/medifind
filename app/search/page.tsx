import { LogoutButton } from "@/components/auth/LogoutButton";

export default function SearchPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white font-sans text-ink-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Medicine search</h1>
        <p className="mt-2 text-ink-600">Search will be available here soon.</p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
