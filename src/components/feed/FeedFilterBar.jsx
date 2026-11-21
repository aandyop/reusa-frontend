import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import {
  CATEGORIES,
  CONDITIONS,
  MODALITIES,
  SIZE_SCALES,
} from "../../utils/constants";

export default function FeedFilterBar({ filters, onChangeFilters, onResetFilters }) {
  const handleFieldChange = (field, value) => {
    onChangeFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleStreetTag = () => {
    onChangeFilters((prev) => ({
      ...prev,
      tag: prev.tag === "Está en la calle" ? "" : "Está en la calle",
    }));
  };

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.modality ||
      filters.condition ||
      filters.sizeScale ||
      filters.tag
  );

  return (
    <section
      aria-label="Filtros de búsqueda del feed"
      className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs"
    >
      {/* Fila 1: Buscador principal + Filtro rápido "Está en la calle" */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={filters.q || ""}
            onChange={(e) => handleFieldChange("q", e.target.value)}
            placeholder="Buscar sofá, escritorio, licuadora, madera..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F6] py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 transition focus:border-[#2D6A4F] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={toggleStreetTag}
          className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${
            filters.tag === "Está en la calle"
              ? "border-amber-400 bg-amber-100 text-amber-900"
              : "border-stone-200 bg-[#FAF9F6] text-stone-700 hover:bg-stone-100"
          }`}
        >
          <MapPin className="h-4 w-4 text-amber-600" />
          <span>Está en la calle</span>
        </button>
      </div>

      {/* Fila 2: Selectores combinables */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrar:
        </span>

        {/* Categoría */}
        <select
          aria-label="Filtrar por categoría"
          value={filters.category || ""}
          onChange={(e) => handleFieldChange("category", e.target.value)}
          className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 focus:border-[#2D6A4F] focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Modalidad */}
        <select
          aria-label="Filtrar por modalidad"
          value={filters.modality || ""}
          onChange={(e) => handleFieldChange("modality", e.target.value)}
          className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 focus:border-[#2D6A4F] focus:outline-none"
        >
          <option value="">Donación o Trueque</option>
          {MODALITIES.map((mod) => (
            <option key={mod} value={mod}>
              {mod}
            </option>
          ))}
        </select>

        {/* Estado físico */}
        <select
          aria-label="Filtrar por estado físico"
          value={filters.condition || ""}
          onChange={(e) => handleFieldChange("condition", e.target.value)}
          className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 focus:border-[#2D6A4F] focus:outline-none"
        >
          <option value="">Cualquier estado</option>
          {CONDITIONS.map((cond) => (
            <option key={cond} value={cond}>
              {cond}
            </option>
          ))}
        </select>

        {/* Talla / Medidas */}
        <select
          aria-label="Filtrar por tamaño y peso"
          value={filters.sizeScale || ""}
          onChange={(e) => handleFieldChange("sizeScale", e.target.value)}
          className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 focus:border-[#2D6A4F] focus:outline-none"
        >
          <option value="">Todas las tallas</option>
          {SIZE_SCALES.map((s) => (
            <option key={s.code} value={s.code}>
              Talla {s.code} · {s.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="ml-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>
    </section>
  );
}