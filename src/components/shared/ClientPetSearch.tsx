import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Owner, Pet } from "@/types";

export interface SelectedMatch {
  owner: Owner | null;
  pet: Pet | null;
}

interface Props {
  onSelect: (match: SelectedMatch) => void;
  onClear?: () => void;
}

export default function ClientPetSearch({ onSelect, onClear }: Props) {
  const { owners, pets } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const results: { owner: Owner; pet: Pet | null }[] = [];
    const seen = new Set<string>();

    for (const pet of pets) {
      const owner = owners.find((o) => o.id === pet.ownerId);
      if (!owner) continue;
      if (
        pet.name.toLowerCase().includes(q) ||
        owner.name.toLowerCase().includes(q) ||
        owner.idNumber?.toLowerCase().includes(q) ||
        owner.phone?.toLowerCase().includes(q)
      ) {
        const key = `${owner.id}-${pet.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ owner, pet });
        }
      }
    }

    for (const owner of owners) {
      if (
        owner.name.toLowerCase().includes(q) ||
        owner.idNumber?.toLowerCase().includes(q) ||
        owner.phone?.toLowerCase().includes(q)
      ) {
        const ownerPets = pets.filter((p) => p.ownerId === owner.id);
        if (ownerPets.length === 0) {
          const key = `${owner.id}-null`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ owner, pet: null });
          }
        } else {
          for (const pet of ownerPets) {
            const key = `${owner.id}-${pet.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ owner, pet });
            }
          }
        }
      }
    }

    return results.slice(0, 12);
  }, [query, owners, pets]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [matches]);

  const handleSelect = (match: { owner: Owner; pet: Pet | null }) => {
    onSelect({ owner: match.owner, pet: match.pet });
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onClear?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query.trim() && setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIdx((i) => Math.min(i + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && matches[highlightIdx]) {
                e.preventDefault();
                handleSelect(matches[highlightIdx]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Buscar cliente, cédula o mascota..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2b6cb0] focus:outline-none focus:ring-1 focus:ring-[#2b6cb0]"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
          {matches.map((m, idx) => (
            <button
              key={`${m.owner.id}-${m.pet?.id ?? "null"}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(m);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                idx === highlightIdx ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">
                  {m.pet ? m.pet.name : m.owner.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {m.pet ? `${m.pet.species} · ` : ""}{m.owner.name}
                  {m.owner.idNumber ? ` · ${m.owner.idNumber}` : ""}
                  {m.owner.phone ? ` · ${m.owner.phone}` : ""}
                </div>
              </div>
              {m.pet && (
                <span className="text-xs font-medium text-[#2b6cb0] bg-blue-50 px-2 py-0.5 rounded">
                  {m.pet.species}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 shadow-lg">
          No se encontraron coincidencias. Use &quot;Ingreso manual&quot; abajo.
        </div>
      )}
    </div>
  );
}
