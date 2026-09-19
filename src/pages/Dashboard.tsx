import { useState } from 'react';
import { Panel, PanelHeader } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { StatusDot } from '@/components/StatusDot';
import { Donut } from '@/components/Donut';
import { Sparkline } from '@/components/Sparkline';
import { TacticalSeaView } from '@/components/TacticalSeaView';
import { useCountUp } from '@/hooks/useCountUp';
import type { Vessel, PrimeSuspectResponse } from '@/lib/api';
import type { ActivityEvent } from '@/hooks/useDashboardData';
import { Play, FileBarChart, AlertTriangle, Waves, Wind, Satellite, Radio, Database } from 'lucide-react';

interface DashboardProps {
  vessels: Vessel[];
  totalVessels: number;
  anomalyCount: number;
  primeSuspect: PrimeSuspectResponse | null;
  events: ActivityEvent[];
  online: boolean;
  onVesselClick: (v: Vessel) => void;
  onRunSim: (v: Vessel) => void;
  onNavigate: (page: string) => void;
}

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-panel px-3 py-2 flex items-center gap-2">
      <span className="section-label whitespace-nowrap">{label}</span>
      <span className="metric-value text-sm font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  status,
  statusColor,
  children,
  accent,
}: {
  label: string;
  value: string;
  subtitle: string;
  status: string;
  statusColor: string;
  children?: React.ReactNode;
  accent?: 'cyan' | 'gold' | 'danger' | 'purple';
}) {
  const borderClass =
    accent === 'gold'
      ? 'border-r-2 border-r-[#FFD700]'
      : accent === 'danger'
        ? 'border-r-2 border-r-[#FF4444]'
        : accent === 'purple'
          ? 'border-r-2 border-r-[#A855F7]'
          : '';

  return (
    <div className={`glass-panel glass-panel-hover p-4 ${borderClass}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="section-label">{label}</span>
        <div className="flex items-center gap-1.5">
          <StatusDot color={statusColor} />
          <span className="text-[0.625rem] font-medium uppercase" style={{ color: statusColor }}>
            {status}
          </span>
        </div>
      </div>
      <div className="metric-value text-2xl font-semibold text-white mb-1">{value}</div>
      <div className="text-xs text-muted mb-3">{subtitle}</div>
      {children}
    </div>
  );
}

const SIM_HEATMAPS = [
  { name: 'Real satellite spill', value: null, isRef: true },
  { name: 'SEA SOLIDARITY', value: 69.2 },
  { name: 'EVER BEST', value: 66.9 },
  { name: 'DARVA SATI', value: 54.9 },
];

function MiniHeatmap({ name, value, isRef }: { name: string; value: number | null; isRef?: boolean }) {
  const intensity = value ? value / 100 : 1;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-full aspect-square rounded-md overflow-hidden relative"
        style={{
          background: isRef
            ? 'radial-gradient(ellipse at 40% 50%, rgba(255,68,68,0.6) 0%, rgba(255,68,68,0.1) 50%, transparent 80%)'
            : `radial-gradient(ellipse at ${50 - intensity * 10}% ${40 + intensity * 10}%, rgba(255,${Math.floor(100 + intensity * 50)},${Math.floor(50 + intensity * 30)},${0.4 + intensity * 0.3}) 0%, rgba(255,${Math.floor(80 + intensity * 40)},${Math.floor(40 + intensity * 20)},0.1) 50%, transparent 85%)`,
          border: isRef ? '1px solid rgba(255,68,68,0.3)' : '1px solid rgba(0,212,255,0.15)',
        }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 0%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.2) 0%, transparent 40%)',
        }} />
      </div>
      <div className="text-[0.625rem] font-medium text-white text-center leading-tight">{name}</div>
      {value !== null && (
        <div className="metric-value text-xs text-[#FFD700]">{value.toFixed(1)}%</div>
      )}
      {isRef && <div className="text-[0.5625rem] text-muted uppercase tracking-wider">Reference</div>}
    </div>
  );
}

function ActivityLog({ events }: { events: ActivityEvent[] }) {
  const colorMap: Record<string, string> = {
    info: '#00D4FF',
    warning: '#FFA500',
    danger: '#FF4444',
    success: '#00FF88',
  };

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Activity Log" />
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {events.length === 0 && (
          <div className="text-xs text-muted text-center py-4">No events yet</div>
        )}
        {events.map((evt, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[rgba(0,212,255,0.04)] transition-colors"
          >
            <span className="metric-value text-[0.625rem] text-muted shrink-0 mt-0.5">
              {evt.time}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
              style={{ backgroundColor: colorMap[evt.level] }}
            />
            <span className="text-xs text-white/80 leading-relaxed">{evt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard({
  vessels,
  totalVessels,
  anomalyCount,
  primeSuspect,
  events,
  onVesselClick,
  onNavigate,
}: DashboardProps) {
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const fleetCount = useCountUp(totalVessels || 72, 1000);
  const spillPct = useCountUp(0.77, 1500, 2);
  const iouScore = useCountUp(69.2, 1500, 1);

  const primeName = primeSuspect?.name || 'SEA SOLIDARITY';
  const primeMmsi = primeSuspect?.mmsi || '566693800';
  const primeScore = primeSuspect?.attribution_score || 95;

  const sparkData = Array.from({ length: 30 }, (_, i) => 70 + Math.sin(i * 0.3) * 5 + Math.random() * 3);

  const handleVesselClick = (v: Vessel) => {
    setSelectedVessel(v);
    onVesselClick(v);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SECTION A: Full-width Tactical Map */}
        <div className="relative h-[550px] glass-panel overflow-hidden">
          <TacticalSeaView
            vessels={vessels}
            primeSuspectName={primeName}
            onVesselClick={handleVesselClick}
          />

          {/* Overlay: top-left badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 glass-panel px-3 py-1.5 z-20 pointer-events-none">
            <StatusDot color="#FF4444" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF4444]">
              Live Investigation
            </span>
          </div>

          {/* Overlay: top-right case ID */}
          <div className="absolute top-3 right-16 glass-panel px-3 py-1.5 z-20 pointer-events-none">
            <span className="section-label">Case</span>
            <span className="metric-value text-xs text-[#00D4FF] ml-1.5">#SAG-2026-001</span>
          </div>

          {/* Overlay: bottom metric pills */}
          <div className="absolute bottom-14 left-3 right-3 flex flex-wrap gap-2 justify-center z-20 pointer-events-none">
            <MetricPill label="Active Fleet" value={`${fleetCount}`} color="#00D4FF" />
            <MetricPill label="Detected Spill" value={`${spillPct.toFixed(2)}%`} color="#FFA500" />
            <MetricPill label="Anomalies" value={`${anomalyCount || 8}`} color="#FF4444" />
            <MetricPill label="Prime Suspect" value={primeName} color="#FFD700" />
          </div>
        </div>

        {/* SECTION B: Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Fleet"
            value={`${fleetCount}`}
            subtitle="Singapore Strait"
            status="LIVE"
            statusColor="#00FF88"
          >
            <Sparkline data={sparkData} color="#00D4FF" width={200} height={36} />
          </MetricCard>

          <MetricCard
            label="Detected Spill"
            value={`${spillPct.toFixed(2)}%`}
            subtitle="U-Net++ · 99.3% val accuracy"
            status="Detected"
            statusColor="#FFA500"
          >
            <div className="flex items-center gap-3">
              <Donut value={0.77} max={1} size={60} thickness={6} color="#FFA500" label="0.77%" />
              <div className="text-[0.625rem] text-muted leading-relaxed">
                Coverage area<br />analyzed by<br />SAR satellite
              </div>
            </div>
          </MetricCard>

          <MetricCard
            label="Prime Suspect"
            value={primeName}
            subtitle={`MMSI ${primeMmsi}`}
            status={`Attribution ${primeScore}/100`}
            statusColor="#FFD700"
            accent="danger"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[rgba(255,215,0,0.1)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FFA500] to-[#FFD700] rounded-full"
                  style={{ width: `${primeScore}%`, transition: 'width 1s ease-out' }}
                />
              </div>
              <Badge color="gold">{primeScore}/100</Badge>
            </div>
          </MetricCard>

          <MetricCard
            label="Virtual Spill Test ★"
            value={`${iouScore.toFixed(1)}%`}
            subtitle="Physics-based attribution"
            status="Unique Innovation"
            statusColor="#A855F7"
            accent="purple"
          >
            <Badge color="gold" className="mb-1">UNIQUE INNOVATION</Badge>
            <div className="text-[0.625rem] text-muted">IoU match with satellite footprint</div>
          </MetricCard>
        </div>

        {/* SECTION C: Prime Suspect Panel (full width) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-panel p-0 overflow-hidden flex flex-col">
            <PanelHeader
              title="Prime Suspect"
              right={<Badge color="danger">FLAGGED</Badge>}
            />
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[rgba(255,215,0,0.12)] border border-[#FFD700] flex items-center justify-center">
                  <span className="metric-value text-sm font-semibold text-[#FFD700]">
                    {primeName.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{primeName}</div>
                  <div className="text-xs text-muted">MMSI {primeMmsi}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Distance', value: '0.07°' },
                  { label: 'Speed', value: '10.4 kn' },
                  { label: 'Heading', value: '088°' },
                  { label: 'Type', value: 'Crude Oil' },
                ].map((item) => (
                  <div key={item.label} className="bg-[rgba(0,212,255,0.04)] rounded-md px-2.5 py-1.5">
                    <div className="section-label text-[0.5625rem]">{item.label}</div>
                    <div className="metric-value text-sm text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Donut value={primeScore} size={72} thickness={7} color="#FFD700" label={`${primeScore}`} sublabel="Attribution" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="section-label">IoU Progress</span>
                    <span className="metric-value text-xs text-[#00D4FF]">41.9%</span>
                  </div>
                  <div className="h-2 bg-[rgba(0,212,255,0.08)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FF88] rounded-full"
                      style={{ width: '41.9%', transition: 'width 1s ease-out' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.2)]">
                <AlertTriangle size={14} className="text-[#FF4444] shrink-0" />
                <span className="text-xs text-[#FF4444]">14-minute AIS silence detected</span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => onNavigate('virtual-spill')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[rgba(0,212,255,0.12)] hover:bg-[rgba(0,212,255,0.2)] border border-cyan-dim text-[#00D4FF] text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  <Play size={12} /> Run Virtual Spill Test
                </button>
                <button
                  onClick={() => onNavigate('evidence')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[rgba(255,215,0,0.08)] hover:bg-[rgba(255,215,0,0.15)] border border-[rgba(255,215,0,0.2)] text-[#FFD700] text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  <FileBarChart size={12} /> View Evidence Timeline
                </button>
              </div>
            </div>
          </div>

          {/* U-Net++ Detection Model */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="section-label">U-Net++ Detection Model</span>
              <Badge color="success">ACTIVE</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[rgba(0,212,255,0.04)] rounded-md px-3 py-2">
                <div className="section-label text-[0.5625rem]">Val Accuracy</div>
                <div className="metric-value text-lg text-[#00FF88]">99.3%</div>
              </div>
              <div className="bg-[rgba(0,212,255,0.04)] rounded-md px-3 py-2">
                <div className="section-label text-[0.5625rem]">Detection Rate</div>
                <div className="metric-value text-lg text-[#FFA500]">0.77%</div>
              </div>
            </div>
            <div>
              <div className="section-label mb-1.5">Training Loss</div>
              <Sparkline
                data={Array.from({ length: 40 }, (_, i) => {
                  const v = Math.exp(-i * 0.08) + Math.random() * 0.02;
                  return Math.max(0.01, 1 - v);
                })}
                color="#00D4FF"
                width={280}
                height={48}
                fillOpacity={0.1}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['PyTorch', 'ResNet34', 'Dice Loss'].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[0.625rem] font-medium bg-[rgba(0,212,255,0.08)] text-[#00D4FF] border border-cyan-dim"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Virtual Spill Simulation */}
          <div className="glass-panel p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="section-label">Virtual Spill Simulation ★</span>
              <Badge color="gold">UNIQUE INNOVATION</Badge>
            </div>
            <div className="text-xs text-muted -mt-1">Physics-Based Vessel Attribution</div>
            <div className="grid grid-cols-2 gap-2">
              {SIM_HEATMAPS.map((h) => (
                <MiniHeatmap key={h.name} name={h.name} value={h.value} isRef={h.isRef} />
              ))}
            </div>
            <div className="text-[0.625rem] text-muted text-center">
              IoU overlap scores vs. satellite reference
            </div>
          </div>
        </div>

        {/* SECTION D: Data Sources */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-label">Data Sources</span>
            <Badge color="cyan">4 SOURCES</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { name: 'Sentinel-1 SAR', sub: 'Copernicus', status: 'ACTIVE', color: '#00FF88', icon: Satellite },
              { name: 'Copernicus Marine', sub: 'Ocean currents', status: 'ACTIVE', color: '#00FF88', icon: Waves },
              { name: 'ERA5 Wind', sub: 'ECMWF', status: 'ACTIVE', color: '#00FF88', icon: Wind },
              { name: 'AISStream API', sub: `${totalVessels || 72} ships`, status: 'LIVE', color: '#00D4FF', icon: Radio },
            ].map((src) => {
              const Icon = src.icon;
              return (
                <div
                  key={src.name}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-[rgba(0,212,255,0.03)] hover:bg-[rgba(0,212,255,0.06)] transition-colors"
                >
                  <Icon size={14} className="text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{src.name}</div>
                    <div className="text-[0.625rem] text-muted">{src.sub}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusDot color={src.color} />
                    <span className="text-[0.625rem] font-medium" style={{ color: src.color }}>
                      {src.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-[0.625rem] text-muted">
            <Database size={10} />
            All data sources operational
          </div>
        </div>
      </div>

      {/* SECTION E: Activity Log */}
      <div className="w-72 shrink-0 p-4 pl-0 hidden xl:block">
        <div className="glass-panel h-full overflow-hidden">
          <ActivityLog events={events} />
        </div>
      </div>
    </div>
  );
}
