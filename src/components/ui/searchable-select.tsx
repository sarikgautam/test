import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface SearchableSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  const [search, setSearch] = React.useState("");
  const [showList, setShowList] = React.useState(true);
  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    if (!value) setShowList(true);
  }, [value]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("relative", className)}>
      {value && selectedOption && !showList ? (
        <div className="flex items-center gap-2 border rounded px-3 py-2 bg-muted">
          <span className="flex-1">{selectedOption.label}</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive ml-2"
            onClick={() => {
              onChange("");
              setShowList(true);
              setSearch("");
            }}
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <Input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setShowList(true);
            }}
            className="mb-2"
            onFocus={() => setShowList(true)}
          />
          {showList && (
            <div className="max-h-48 overflow-y-auto border rounded bg-background absolute w-full z-10">
              {filtered.length === 0 && (
                <div className="p-2 text-muted-foreground text-sm">No results</div>
              )}
              {filtered.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    "p-2 cursor-pointer hover:bg-muted",
                    value === opt.value && "bg-primary/10 font-semibold"
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setShowList(false);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
