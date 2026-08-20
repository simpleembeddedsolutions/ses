import { useMemo } from "react";
import { Search, X, Tag as TagIcon } from "lucide-react";
import type { Entry, SearchFilters } from "../types";
import { EMPTY_SEARCH_FILTERS } from "../types";
import { KNOWLEDGE_TYPES } from "../data";
import { fmtDate, TypeBadge, EmptyState } from "../lib";

export function SearchKnowledge({
  entries, filters, onFiltersChange, goToEntry,
}: {
  entries: Entry[];
  filters: SearchFilters;
  onFiltersChange: (next: SearchFilters) => void;
  goToEntry: (id: string) => void;
}) {
  const patch = (p: Partial<SearchFilters>) => onFiltersChange({ ...filters, ...p });
  const { q, fInterface, fIc, fProject, fType, fTag, fromDate, toDate } = filters;

  const interfaces = useMemo(() => Array.from(new Set(entries.map((e) => e.interface).filter(Boolean))).sort(), [entries]);
  const projects = useMemo(() => Array.from(new Set(entries.map((e) => e.project).filter(Boolean))).sort(), [entries]);
  const ics = useMemo(() => Array.from(new Set(entries.map((e) => e.ic).filter(Boolean))).sort(), [entries]);
  const types = useMemo(
    () => Array.from(new Set([...KNOWLEDGE_TYPES, ...entries.flatMap((e) => e.types)])).filter(Boolean).sort(),
    [entries]
  );
  const tags = useMemo(() => Array.from(new Set(entries.flatMap((e) => e.tags))).sort(), [entries]);

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (ql) {
        const hay = [e.title, e.content, e.ic, e.interface, ...e.tags].join(" ").toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      if (fInterface && e.interface !== fInterface) return false;
      if (fIc && e.ic !== fIc) return false;
      if (fProject && e.project !== fProject) return false;
      if (fType && !e.types.includes(fType)) return false;
      if (fTag && !e.tags.includes(fTag)) return false;
      if (fromDate && e.createdDate < fromDate) return false;
      if (toDate && e.createdDate > toDate) return false;
      return true;
    }).sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  }, [entries, q, fInterface, fIc, fProject, fType, fTag, fromDate, toDate]);

  // When a project tab is active, cluster its results by knowledge type —
  // built-in types first (in their usual order), then any custom ones.
  const grouped = useMemo(() => {
    if (!fProject) return null;
    const map = new Map<string, Entry[]>();
    for (const e of results) {
      for (const t of e.types) {
        if (!map.has(t)) map.set(t, []);
        map.get(t)!.push(e);
      }
    }
    const order = [
      ...KNOWLEDGE_TYPES.filter((t) => map.has(t)),
      ...Array.from(map.keys()).filter((t) => !KNOWLEDGE_TYPES.includes(t)).sort(),
    ];
    return order.map((t) => [t, map.get(t)!] as const);
  }, [results, fProject]);

  const clearFilters = () => onFiltersChange({ ...EMPTY_SEARCH_FILTERS, q: filters.q });
  const anyFilter = fInterface || fIc || fProject || fType || fTag || fromDate || toDate;

  const renderCard = (e: Entry) => (
    <button className="result-card" key={e.id} onClick={() => goToEntry(e.id)}>
      <div className="result-card-top">
        <span className="pill">{e.interface}</span>
        {e.ic && <span className="pill mono">{e.ic}</span>}
      </div>
      <div className="result-card-title">{e.title}</div>
      <div className="result-card-summary">{e.content.replace(/[#*`-]/g, "").slice(0, 110)}…</div>
      <div className="result-card-types">{e.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
      <div className="result-card-bottom">
        <div className="result-card-tags">
          {e.tags.slice(0, 3).map((t) => <span key={t} className="tag-chip static"><TagIcon size={10} />{t}</span>)}
        </div>
        <span className="result-card-date">{fmtDate(e.createdDate)}</span>
      </div>
    </button>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title"><span className="page-title-icon"><Search size={19} /></span><h1>Search Knowledge</h1></div>
        <p className="page-sub">{results.length} result{results.length !== 1 ? "s" : ""} across {entries.length} entries</p>
      </div>

      <div className="search-box-lg">
        <Search size={17} />
        <input value={q} onChange={(e) => patch({ q: e.target.value })} placeholder="Search knowledge, IC, interface, issue, lesson learned…" />
        {q && <button onClick={() => patch({ q: "" })} aria-label="Clear search"><X size={14} /></button>}
      </div>

      <div className="tabs-row">
        <button
          type="button" className={"tab-pill" + (!fProject ? " active" : "")}
          onClick={() => patch({ fProject: "" })}
        >
          All
        </button>
        {projects.map((p) => (
          <button
            type="button" key={p} className={"tab-pill" + (fProject === p ? " active" : "")}
            onClick={() => patch({ fProject: p })}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <select value={fInterface} onChange={(e) => patch({ fInterface: e.target.value })}>
          <option value="">All interfaces</option>
          {interfaces.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={fIc} onChange={(e) => patch({ fIc: e.target.value })}>
          <option value="">All ICs</option>
          {ics.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={fType} onChange={(e) => patch({ fType: e.target.value })}>
          <option value="">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={fTag} onChange={(e) => patch({ fTag: e.target.value })}>
          <option value="">All tags</option>
          {tags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="date-range">
          <input type="date" value={fromDate} onChange={(e) => patch({ fromDate: e.target.value })} />
          <span>→</span>
          <input type="date" value={toDate} onChange={(e) => patch({ toDate: e.target.value })} />
        </div>
        {anyFilter && <button className="btn-ghost" onClick={clearFilters}>Clear filters</button>}
      </div>

      {results.length === 0 ? (
        <EmptyState icon={<Search size={22} strokeWidth={1.5} />} title="No entries match" note="Try a broader search term or fewer filters." />
      ) : fProject && grouped ? (
        <div className="grouped-results">
          {grouped.map(([t, list]) => (
            <div key={t}>
              <div className="type-section-head">
                {t.toUpperCase()} <span className="type-section-count">({list.length})</span>
              </div>
              <div className="result-grid">{list.map(renderCard)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="result-grid">{results.map(renderCard)}</div>
      )}
    </div>
  );
}
