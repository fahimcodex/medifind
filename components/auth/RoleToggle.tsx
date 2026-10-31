type Role = "patient" | "pharmacy";

type RoleToggleProps = {
  value: Role;
  onChange: (role: Role) => void;
};

const roles: Array<{ value: Role; label: string }> = [
  { value: "patient", label: "Patient" },
  { value: "pharmacy", label: "Pharmacy" },
];

export function RoleToggle({ value, onChange }: RoleToggleProps) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-surface p-1" role="group" aria-label="Account type">
      {roles.map((role) => {
        const isSelected = role.value === value;

        return (
          <button
            key={role.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(role.value)}
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
              isSelected ? "bg-white text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}
