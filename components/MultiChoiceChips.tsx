export function MultiChoiceChips<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              borderColor: isSelected ? "var(--accent)" : "var(--line)",
              background: isSelected ? "color-mix(in srgb, var(--accent) 16%, var(--panel))" : "var(--panel)",
              color: isSelected ? "var(--accent)" : "var(--chalk)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
