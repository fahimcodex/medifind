import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { SearchBar } from "@/components/search/SearchBar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type Medicine = {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string | null;
  form: string | null;
  category: string | null;
};

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const queryParam = params.q;
  const query = (Array.isArray(queryParam) ? queryParam[0] : queryParam)?.trim() ?? "";
  let medicines: Medicine[] = [];

  if (query) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medicines")
      .select("id, brand_name, generic_name, strength, form, category")
      .or(`brand_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
      .order("brand_name");

    if (error) {
      throw new Error("Unable to search medicines.", { cause: error });
    }

    medicines = (data ?? []) as Medicine[];
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink-900">
      <Navbar />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-[780px]">
          <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Find your medicine</h1>
          <p className="mt-3 text-ink-600">Search by brand or generic name to find medicine information.</p>
          <div className="mt-8">
            <SearchBar initialQuery={query} />
          </div>
        </div>

        <section className="mt-12" aria-live="polite">
          {medicines.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {medicines.map((medicine) => (
                <Link
                  key={medicine.id}
                  href={`/medicines/${medicine.id}`}
                  className="rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-primary-600">{medicine.category ?? "Medicine"}</p>
                  <h2 className="mt-3 text-xl font-bold">{medicine.brand_name}</h2>
                  <p className="mt-1 text-ink-600">{medicine.generic_name}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
                    <div>
                      <dt className="text-ink-400">Strength</dt>
                      <dd className="mt-1 font-medium text-ink-900">{medicine.strength ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-400">Form</dt>
                      <dd className="mt-1 font-medium text-ink-900">{medicine.form ?? "—"}</dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
              <h2 className="text-xl font-bold">No medicines found</h2>
              <p className="mt-2 text-ink-600">Try searching with a different brand or generic name.</p>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-sm text-ink-600">
          Availability may be outdated. Confirm with the pharmacy before visiting.
        </p>
      </main>
      <Footer />
    </div>
  );
}
