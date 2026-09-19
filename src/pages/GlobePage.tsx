import { Globe } from '@/components/Globe';
import { Panel, PanelHeader } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import type { Vessel } from '@/lib/api';
import { useState } from 'react';

interface GlobePageProps {
  vessels: Vessel[];
  primeSuspectName?: string;
}

export function GlobePage({ vessels, primeSuspectName }: GlobePageProps) {
  const [selected, setSelected] = useState<Vessel | null>(null);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 p-4">
        <div className="glass-panel overflow-hidden h-full relative">
          <Globe vessels={vessels} primeSuspectName={primeSuspectName} onVesselClick={setSelected} />
          <div className="absolute top-3 left-3 glass-panel px-3 py-1.5">
            <span className="section-label">3D Globe View</span>
            <span className="text-xs text-[#00D4FF] ml-2 font-semibold">{vessels.length} vessels</span>
          </div>
          <div className="absolute bottom-3 left-3 flex gap-2">
            <div className="flex items-center gap-1.5 glass-panel px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-[#00D4FF]" />
              <span className="text-[0.625rem] text-muted">Normal</span>
            </div>
            <div className="flex items-center gap-1.5 glass-panel px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-[#FF4444]" />
              <span className="text-[0.625rem] text-muted">Anomaly</span>
            </div>
            <div className="flex items-center gap-1.5 glass-panel px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              <span className="text-[0.625rem] text-muted">Prime Suspect</span>
            </div>
          </div>
        </div>
      </div>
      {selected && (
        <div className="w-72 shrink-0 p-4 pl-0">
          <div className="glass-panel h-full overflow-y-auto">
            <PanelHeader title="Vessel Details" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  selected.is_prime_suspect || selected.name === primeSuspectName
                    ? 'bg-[rgba(255,215,0,0.12)] border-[#FFD700]'
                    : selected.is_anomaly
                      ? 'bg-[rgba(255,68,68,0.08)] border-[#FF4444]/40'
                      : 'bg-[rgba(0,212,255,0.08)] border-cyan-dim'
                }`}>
                  <span className="metric-value text-sm font-semibold text-white">{selected.name.slice(0, 2)}</span>
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
                  { label: 'Latitude', value: selected.lat.toFixed(4) },
                  { label: 'Longitude', value: selected.lon.toFixed(4) },
                  { label: 'Anomaly', value: `${((selected.anomaly_score || 0) * 100).toFixed(0)}%` },
                ].map((item) => (
                  <div key={item.label} className="bg-[rgba(0,212,255,0.04)] rounded-md px-2.5 py-1.5">
                    <div className="section-label text-[0.5625rem]">{item.label}</div>
                    <div className="metric-value text-sm text-white">{item.value}</div>
                  </div>
                ))}
              </div>
              {selected.is_prime_suspect || selected.name === primeSuspectName ? (
                <Badge color="gold">PRIME SUSPECT</Badge>
              ) : selected.is_anomaly ? (
                <Badge color="danger">ANOMALY DETECTED</Badge>
              ) : (
                <Badge color="success">NORMAL</Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
