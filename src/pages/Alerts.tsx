import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Panel, PanelHeader } from '@/components/Panel';
import { StatusDot } from '@/components/StatusDot';
import type { ActivityEvent } from '@/hooks/useDashboardData';

interface AlertsProps {
  events: ActivityEvent[];
}

const STATIC_ALERTS = [
  { level: 'danger', title: 'AIS Silence Detected', vessel: 'SEA SOLIDARITY', time: '14 min gap', desc: '14-minute AIS transmission gap — possible intentional disablement', icon: AlertTriangle },
  { level: 'danger', title: 'Prime Suspect Flagged', vessel: 'SEA SOLIDARITY', time: 'T-5h', desc: 'Attribution score 95/100 — highest among 3 vessels in origin zone', icon: AlertTriangle },
  { level: 'warning', title: 'Anomalous Behavior', vessel: 'EVER BEST', time: 'T-3h', desc: 'Speed reduction and heading deviation detected by Isolation Forest', icon: AlertTriangle },
  { level: 'warning', title: 'Anomalous Behavior', vessel: 'DARVA SATI', time: 'T-2h', desc: 'Route deviation from standard shipping lane detected', icon: AlertTriangle },
  { level: 'info', title: 'Satellite Pass Complete', vessel: 'Sentinel-1', time: 'T-0h', desc: 'SAR imagery acquired — oil slick confirmed at 0.77% coverage', icon: Info },
  { level: 'success', title: 'Simulation Complete', vessel: 'SEA SOLIDARITY', time: 'T-1h', desc: 'Virtual spill test completed — 69.2% IoU match with satellite footprint', icon: CheckCircle2 },
];

export function Alerts({ events }: AlertsProps) {
  const colorMap: Record<string, string> = {
    danger: '#FF4444',
    warning: '#FFA500',
    info: '#00D4FF',
    success: '#00FF88',
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="glass-panel overflow-hidden">
          <PanelHeader
            title="Active Alerts"
            right={
              <div className="flex items-center gap-2">
                <Badge color="danger">3 CRITICAL</Badge>
                <Badge color="warning">2 WARNING</Badge>
              </div>
            }
          />
          <div className="p-4 space-y-3">
            {STATIC_ALERTS.map((alert, i) => {
              const Icon = alert.icon;
              const color = colorMap[alert.level];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-md bg-[rgba(0,212,255,0.03)] hover:bg-[rgba(0,212,255,0.06)] transition-colors"
                  style={{ borderLeft: `2px solid ${color}` }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + '15' }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{alert.title}</span>
                      <span className="metric-value text-[0.625rem] text-muted shrink-0">{alert.time}</span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">{alert.vessel}</div>
                    <div className="text-xs text-white/70 mt-1">{alert.desc}</div>
                  </div>
                  <Badge
                    color={alert.level === 'danger' ? 'danger' : alert.level === 'warning' ? 'warning' : alert.level === 'success' ? 'success' : 'cyan'}
                  >
                    {alert.level.toUpperCase()}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* System events */}
        <div className="glass-panel overflow-hidden">
          <PanelHeader title="System Event Log" right={<Bell size={14} className="text-muted" />} />
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {events.map((evt, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[rgba(0,212,255,0.04)]">
                <span className="metric-value text-[0.625rem] text-muted shrink-0 mt-0.5">{evt.time}</span>
                <StatusDot color={colorMap[evt.level]} size={6} pulse={false} />
                <span className="text-xs text-white/80">{evt.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
