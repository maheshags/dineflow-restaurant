import { Search, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function FilterBar({ searchValue, onSearchChange, searchPlaceholder = 'Search...', children }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
        />
      </div>
      {children}
    </div>
  );
}

interface SelectFilterProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectFilter({ value, onChange, options, placeholder }: SelectFilterProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition appearance-none cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
