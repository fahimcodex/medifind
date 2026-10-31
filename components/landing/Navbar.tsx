import Link from "next/link";

const links = [
  ["Find Medicine", "#find-medicine"],
  ["Pharmacies", "#pharmacies"],
  ["How it works", "#how-it-works"],
  ["For Pharmacies", "#for-pharmacies"],
];

export function Navbar() {
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
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-4 py-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-primary-50 hover:text-primary-600">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700">
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
