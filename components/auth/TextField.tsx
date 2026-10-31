type TextFieldProps = {
  id: string;
  label: string;
  type?: "email" | "password" | "text";
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function TextField({
  id,
  label,
  type = "text",
  value,
  placeholder,
  onChange,
}: TextFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-ink-900">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-50"
      />
    </label>
  );
}
