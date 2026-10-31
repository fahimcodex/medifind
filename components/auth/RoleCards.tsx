type Role = "patient" | "pharmacy";

type RoleCardsProps = {
  value: Role;
  onChange: (role: Role) => void;
};

const roles: Array<{
  value: Role;
  label: string;
  description: string;
}> = [
  {
    value: "patient",
    label: "Patient",
    description: "Search & reserve medicines",
  },
  {
    value: "pharmacy",
    label: "Pharmacy",
    description: "List your stock for patients",
  },
];

export function RoleCards({ value, onChange }: RoleCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Account type">
      {roles.map((role) => {
        const isSelected = role.value === value;

        return (
          <button
            key={role.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(role.value)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              isSelected
                ? "border-primary-600 bg-primary-50 text-ink-900 ring-1 ring-primary-600"
                : "border-line bg-white text-ink-900 hover:border-primary-600"
            }`}
          >
            <span className="block text-sm font-semibold">{role.label}</span>
            <span className="mt-1 block text-xs leading-5 text-ink-600">{role.description}</span>
          </button>
        );
      })}
    </div>
  );
}
