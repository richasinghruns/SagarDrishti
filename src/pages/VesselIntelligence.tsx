import { useMemo, useState } from 'react';
import { Search, Download, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { StatusDot } from '@/components/StatusDot';
import { Donut } from '@/components/Donut';
import type { Vessel, PrimeSuspectResponse } from '@/lib/api';

interface VesselIntelligenceProps {
  vessels: Vessel[];
  primeSuspect: PrimeSuspectResponse | null;
}

type SortKey = keyof Vessel;
type FilterMode = 'all' | 'anomalies' | 'prime';

const PAGE_SIZE = 25;

export function VesselIntelligence({ vessels, primeSuspect }: VesselIntelligenceProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortKey, setSortKey] = useState<SortKey>('anomaly_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Vessel | null>(null);

  const filtered = useMemo(() => {
    let result = [...vessels];

    if (filter === 'anomalies') {
      result = result.filter((v) => v.is_anomaly || v.anomaly_score > 0.5);
    } else if (filter === 'prime') {
      result = result.filter(
        (v) => v.is_prime_suspect || v.name === primeSuspect?.name
      );
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.mmsi.toLowerCase().includes(q) ||
          v.type.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });

    return result;
  }, [vessels, filter, search, sortKey, sortDir, primeSuspect]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const exportCsv = () => {
    const headers = ['Name', 'MMSI', 'Type', 'Speed', 'Lat', 'Lon', 'Anomaly Score', 'Status'];
    const rows = filtered.map((v) => [
      v.name,
      v.mmsi,
      v.type,
      v.speed,
      v.lat,
      v.lon,
      v.anomaly_score,
      v.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vessel-intelligence.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: { key: SortKey; label: string; sortable: boolean }[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'mmsi', label: 'MMSI', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'speed', label: 'Speed', sortable: true },
    { key: 'lat', label: 'Lat', sortable: true },
    { key: 'lon', label: 'Lon', sortable: true },
    { key: 'anomaly_score', label: 'Anomaly Score', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main table area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="glass-panel overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-dim flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="section-label">Vessel Intelligence</span>
              <Badge color="cyan">{filtered.length} vessels</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search vessels..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-md bg-[rgba(10,22,40,0.6)] border border-cyan-dim text-xs text-white placeholder-muted focus:outline-none focus:border-[#00D4FF] w-48"
                />
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'anomalies', 'prime'] as FilterMode[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setPage(0);
                    }}
                    className={`px-2.5 py-1.5 rounded-md text-[0.625rem] font-semibold uppercase tracking-wider transition-all ${
                      filter === f
                        ? 'bg-[rgba(0,212,255,0.12)] text-[#00D4FF] border border-cyan-dim'
                        : 'text-muted hover:text-white border border-transparent'
                    }`}
                  >
                    {f === 'prime' ? 'Prime Suspect' : f}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[rgba(0,212,255,0.08)] hover:bg-[rgba(0,212,255,0.15)] border border-cyan-dim text-[#00D4FF] text-[0.625rem] font-semibold uppercase tracking-wider transition-all"
              >
                <Download size={12} /> Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-cyan-dim">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-3 py-2.5 text-left section-label whitespace-nowrap ${
                        col.sortable ? 'cursor-pointer hover:text-white' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key && (
                          <span className="text-[#00D4FF]">
                            {sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-8 text-muted">
                      No vessels found
                    </td>
                  </tr>
                )}
                {pageItems.map((v, i) => {
                  const isPrime = v.is_prime_suspect || v.name === primeSuspect?.name;
                  const isAnomaly = v.is_anomaly || v.anomaly_score > 0.5;
                  const rowClass = isPrime
                    ? 'bg-[rgba(255,215,0,0.06)] border-l-2 border-l-[#FFD700]'
                    : isAnomaly
                      ? 'bg-[rgba(255,68,68,0.04)] border-l-2 border-l-[#FF4444]/40'
                      : 'border-l-2 border-l-transparent hover:bg-[rgba(0,212,255,0.03)]';

                  return (
                    <tr
                      key={`${v.mmsi}-${i}`}
                      onClick={() => setSelected(v)}
                      className={`${rowClass} cursor-pointer transition-colors border-b border-cyan-dim/30`}
                    >
                      <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">
                        {isPrime && <span className="text-[#FFD700] mr-1">★</span>}
                        {v.name}
                      </td>
                      <td className="px-3 py-2.5 metric-value text-muted">{v.mmsi}</td>
                      <td className="px-3 py-2.5 text-muted">{v.type || 'N/A'}</td>
                      <td className="px-3 py-2.5 metric-value text-white">{v.speed ?? '—'} kn</td>
                      <td className="px-3 py-2.5 metric-value text-muted">{v.lat.toFixed(4)}</td>
                      <td className="px-3 py-2.5 metric-value text-muted">{v.lon.toFixed(4)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[rgba(0,212,255,0.08)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(v.anomaly_score || 0) * 100}%`,
                                backgroundColor:
                                  v.anomaly_score > 0.7 ? '#FF4444' : v.anomaly_score > 0.4 ? '#FFA500' : '#00D4FF',
                              }}
                            />
                          </div>
                          <span
                            className="metric-value text-[0.625rem]"
                            style={{
                              color:
                                v.anomaly_score > 0.7 ? '#FF4444' : v.anomaly_score > 0.4 ? '#FFA500' : '#00D4FF',
                            }}
                          >
                            {((v.anomaly_score || 0) * 100).toFixed(0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {isPrime ? (
                          <Badge color="gold">PRIME</Badge>
                        ) : isAnomaly ? (
                          <Badge color="danger">FLAGGED</Badge>
                        ) : (
                          <span className="flex items-center gap-1 text-[#00FF88]">
                            <StatusDot color="#00FF88" size={6} pulse={false} />
                            <span className="text-[0.625rem]">NORMAL</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-cyan-dim">
            <div className="text-xs text-muted">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded-md text-xs font-medium border border-cyan-dim text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              <span className="metric-value text-xs text-white px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded-md text-xs font-medium border border-cyan-dim text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="w-80 shrink-0 p-4 pl-0">
          <div className="glass-panel h-full overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-dim">
              <span className="section-label">Vessel Details</span>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                    selected.is_prime_suspect || selected.name === primeSuspect?.name
                      ? 'bg-[rgba(255,215,0,0.12)] border-[#FFD700]'
                      : selected.is_anomaly
                        ? 'bg-[rgba(255,68,68,0.08)] border-[#FF4444]/40'
                        : 'bg-[rgba(0,212,255,0.08)] border-cyan-dim'
                  }`}
                >
                  <span className="metric-value text-sm font-semibold text-white">
                    {selected.name.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{selected.name}</div>
                  <div className="text-xs text-muted">MMSI {selected.mmsi}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type', value: selected.type || 'N/A' },
                  { label: 'Speed', value: `${selected.speed ?? '—'} kn` },
                  { label: 'Heading', value: `${selected.heading ?? '—'}°` },
                  { label: 'Status', value: selected.status || 'N/A' },
                  { label: 'Latitude', value: selected.lat.toFixed(4) },
                  { label: 'Longitude', value: selected.lon.toFixed(4) },
                ].map((item) => (
                  <div key={item.label} className="bg-[rgba(0,212,255,0.04)] rounded-md px-2.5 py-1.5">
                    <div className="section-label text-[0.5625rem]">{item.label}</div>
                    <div className="metric-value text-sm text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Donut
                  value={(selected.anomaly_score || 0) * 100}
                  size={72}
                  thickness={7}
                  color={selected.anomaly_score > 0.5 ? '#FF4444' : '#00D4FF'}
                  label={`${((selected.anomaly_score || 0) * 100).toFixed(0)}`}
                  sublabel="Anomaly Score"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="section-label">Track Summary</div>
                  <div className="text-xs text-muted leading-relaxed">
                    Vessel tracked via AIS with {(selected.speed ?? 0).toFixed(1)} kn average speed.
                    {selected.is_anomaly && (
                      <span className="text-[#FF4444] block mt-1">
                        Behavioral anomaly detected by Isolation Forest.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mini track visualization */}
              <div>
                <div className="section-label mb-1.5">Vessel Track</div>
                <div className="h-24 bg-[rgba(10,22,40,0.6)] rounded-md relative overflow-hidden border border-cyan-dim">
                  <svg className="w-full h-full" viewBox="0 0 200 80">
                    <path
                      d="M 20 60 Q 60 40 100 45 T 180 20"
                      fill="none"
                      stroke="#00D4FF"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                    <circle cx="20" cy="60" r="2" fill="#00D4FF" opacity="0.5" />
                    <circle cx="100" cy="45" r="2" fill="#00D4FF" opacity="0.7" />
                    <circle cx="180" cy="20" r="3" fill={selected.is_anomaly ? '#FF4444' : '#00D4FF'} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
