import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Vessel } from '@/lib/api';

interface TacticalMapProps {
  vessels: Vessel[];
  primeSuspectName?: string;
  onVesselClick?: (v: Vessel) => void;
}

type LayerKey = 'ais' | 'slick' | 'origin' | 'currents' | 'wind';

const LAYERS: { key: LayerKey; label: string; color: string }[] = [
  { key: 'ais', label: 'AIS Ships', color: '#0FB9B1' },
  { key: 'slick', label: 'Satellite Slick', color: '#FF4444' },
  { key: 'origin', label: 'Origin Zone', color: '#FFD700' },
  { key: 'currents', label: 'Currents', color: '#00FF88' },
  { key: 'wind', label: 'Wind', color: '#A855F7' },
];

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';

const SPILL_CENTER: [number, number] = [64.0, 18.0];

const OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap',
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster' as const,
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function TacticalMap({ vessels, primeSuspectName, onVesselClick }: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    ais: true,
    slick: true,
    origin: true,
    currents: false,
    wind: false,
  });
  const [hovered, setHovered] = useState<Vessel | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const popupsRef = useRef<maplibregl.Popup[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = (styleUrl: string | object, isFallback: boolean) => {
      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: styleUrl as maplibregl.StyleSpecification,
        center: SPILL_CENTER,
        zoom: 5,
        attributionControl: false,
      });

      map.on('load', () => {
        setMapReady(true);
      });

      map.on('error', (e) => {
        console.error('MapLibre error:', e);
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

      mapRef.current = map;
    };

    // Try OpenFreeMap bright style first, fall back to OSM raster if it fails
    try {
      const testMap = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: SPILL_CENTER,
        zoom: 5,
        attributionControl: false,
      });

      let styleLoaded = false;
      const timeoutId = setTimeout(() => {
        if (!styleLoaded && mapRef.current === testMap) {
          testMap.remove();
          initMap(OSM_FALLBACK_STYLE, true);
        }
      }, 8000);

      testMap.on('load', () => {
        styleLoaded = true;
        clearTimeout(timeoutId);
        setMapReady(true);
      });

      testMap.on('error', () => {
        if (!styleLoaded) {
          clearTimeout(timeoutId);
          try {
            testMap.remove();
          } catch {
            // ignore
          }
          initMap(OSM_FALLBACK_STYLE, true);
        }
      });

      testMap.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      mapRef.current = testMap;
    } catch {
      initMap(OSM_FALLBACK_STYLE, true);
    }

    return () => {
      popupsRef.current.forEach((p) => p.remove());
      popupsRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Update vessel markers and overlays when data or layers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear old popups
    popupsRef.current.forEach((p) => p.remove());
    popupsRef.current = [];

    // Remove old sources/layers
    [
      'vessels-normal',
      'vessels-anomaly',
      'vessels-prime',
      'vessels-prime-pulse',
      'slick-fill',
      'slick-outline',
      'origin-fill',
      'origin-outline',
      'drift-trajectory',
      'drift-arrow',
      'currents',
      'wind',
    ].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    // AIS vessels
    if (layers.ais) {
      const normalFeatures: GeoJSON.Feature[] = vessels
        .filter(
          (v) =>
            !v.is_anomaly &&
            v.anomaly_score <= 0.5 &&
            v.name !== primeSuspectName &&
            !v.is_prime_suspect
        )
        .map((v) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
          properties: {
            name: v.name,
            mmsi: v.mmsi,
            speed: v.speed,
            anomaly_score: v.anomaly_score,
          },
        }));

      const anomalyFeatures: GeoJSON.Feature[] = vessels
        .filter(
          (v) =>
            (v.is_anomaly || v.anomaly_score > 0.5) &&
            v.name !== primeSuspectName &&
            !v.is_prime_suspect
        )
        .map((v) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
          properties: {
            name: v.name,
            mmsi: v.mmsi,
            speed: v.speed,
            anomaly_score: v.anomaly_score,
          },
        }));

      const primeFeatures: GeoJSON.Feature[] = vessels
        .filter((v) => v.is_prime_suspect || v.name === primeSuspectName)
        .map((v) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
          properties: {
            name: v.name,
            mmsi: v.mmsi,
            speed: v.speed,
            anomaly_score: v.anomaly_score,
          },
        }));

      if (normalFeatures.length > 0) {
        map.addSource('vessels-normal', {
          type: 'geojson',
          data: { type: 'FeatureCollection' as const, features: normalFeatures },
        });
        map.addLayer({
          id: 'vessels-normal',
          type: 'circle',
          source: 'vessels-normal',
          paint: {
            'circle-radius': 6,
            'circle-color': '#0FB9B1',
            'circle-opacity': 0.85,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
          },
        });
      }

      if (anomalyFeatures.length > 0) {
        map.addSource('vessels-anomaly', {
          type: 'geojson',
          data: { type: 'FeatureCollection' as const, features: anomalyFeatures },
        });
        map.addLayer({
          id: 'vessels-anomaly',
          type: 'circle',
          source: 'vessels-anomaly',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FF8C00',
            'circle-opacity': 0.9,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        });
      }

      if (primeFeatures.length > 0) {
        map.addSource('vessels-prime', {
          type: 'geojson',
          data: { type: 'FeatureCollection' as const, features: primeFeatures },
        });
        map.addLayer({
          id: 'vessels-prime',
          type: 'circle',
          source: 'vessels-prime',
          paint: {
            'circle-radius': 10,
            'circle-color': '#FFD700',
            'circle-opacity': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2.5,
          },
        });

        // Pulsing ring for prime suspect
        map.addSource('vessels-prime-pulse', {
          type: 'geojson',
          data: { type: 'FeatureCollection' as const, features: primeFeatures },
        });
        map.addLayer({
          id: 'vessels-prime-pulse',
          type: 'circle',
          source: 'vessels-prime-pulse',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3,
              15,
              8,
              25,
            ],
            'circle-color': '#FFD700',
            'circle-opacity': 0.15,
            'circle-stroke-color': '#FFD700',
            'circle-stroke-width': 1.5,
            'circle-stroke-opacity': 0.4,
          },
        });

        // Animate the pulse
        let pulsePhase = 0;
        const animatePulse = () => {
          if (!map.getLayer('vessels-prime-pulse')) return;
          pulsePhase = (pulsePhase + 0.02) % (Math.PI * 2);
          const scale = 1 + Math.sin(pulsePhase) * 0.4;
          map.setPaintProperty('vessels-prime-pulse', 'circle-opacity', 0.05 + Math.sin(pulsePhase) * 0.15);
          requestAnimationFrame(animatePulse);
        };
        animatePulse();
      }

      // Popups for vessel clicks
      const createVesselPopup = (feature: GeoJSON.Feature, coordinates: number[]) => {
        const props = feature.properties as {
          name: string;
          mmsi: string;
          speed: number;
          anomaly_score: number;
        };
        const isPrime = props.name === primeSuspectName;
        const popup = new maplibregl.Popup({ maxWidth: '240px' })
          .setLngLat(coordinates as [number, number])
          .setHTML(
            `<div style="font-family: Inter, sans-serif; padding: 4px;">
              <div style="font-size: 13px; font-weight: 600; color: ${isPrime ? '#FFD700' : props.anomaly_score > 0.5 ? '#FF8C00' : '#0FB9B1'}; margin-bottom: 4px;">
                ${isPrime ? '★ ' : ''}${props.name}
              </div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">MMSI: <span style="font-family: JetBrains Mono, monospace; color: #333;">${props.mmsi}</span></div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">Speed: <span style="font-family: JetBrains Mono, monospace; color: #333;">${props.speed} kn</span></div>
              <div style="font-size: 11px; color: #666;">Anomaly Score: <span style="font-family: JetBrains Mono, monospace; color: ${props.anomaly_score > 0.5 ? '#FF4444' : '#0FB9B1'};">${((props.anomaly_score || 0) * 100).toFixed(0)}%</span></div>
            </div>`
          )
          .addTo(map);
        popupsRef.current.push(popup);
      };

      ['vessels-normal', 'vessels-anomaly', 'vessels-prime'].forEach((layerId) => {
        if (!map.getLayer(layerId)) return;
        map.on('mousemove', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties as { name: string };
            const vessel = vessels.find((v) => v.name === props.name);
            setHovered(vessel || null);
            map.getCanvas().style.cursor = 'pointer';
          }
        });
        map.on('mouseleave', layerId, () => {
          setHovered(null);
          map.getCanvas().style.cursor = '';
        });
        map.on('click', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            createVesselPopup(feature, coords);
            if (onVesselClick) {
              const props = feature.properties as { name: string };
              const vessel = vessels.find((v) => v.name === props.name);
              if (vessel) onVesselClick(vessel);
            }
          }
        });
      });
    }

    // Satellite slick — red irregular polygon
    if (layers.slick) {
      const slickGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Polygon' as const,
              coordinates: [
                [
                  [63.85, 18.05],
                  [63.95, 18.12],
                  [64.1, 18.08],
                  [64.15, 17.98],
                  [64.08, 17.88],
                  [63.92, 17.9],
                  [63.85, 18.05],
                ],
              ],
            },
          },
        ],
      };

      map.addSource('slick-fill', { type: 'geojson', data: slickGeoJSON });
      map.addLayer({
        id: 'slick-fill',
        type: 'fill',
        source: 'slick-fill',
        paint: {
          'fill-color': '#FF4444',
          'fill-opacity': 0.25,
        },
      });
      map.addLayer({
        id: 'slick-outline',
        type: 'line',
        source: 'slick-fill',
        paint: {
          'line-color': '#FF4444',
          'line-width': 2,
        },
      });

      // Spill popup on click
      map.on('click', 'slick-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const popup = new maplibregl.Popup({ maxWidth: '280px' })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family: Inter, sans-serif; padding: 4px;">
                <div style="font-size: 13px; font-weight: 600; color: #FF4444; margin-bottom: 6px;">Detected Oil Spill</div>
                <div style="font-size: 11px; color: #666; margin-bottom: 2px;">Area: <span style="font-family: JetBrains Mono, monospace; color: #333;">3.2 km²</span></div>
                <div style="font-size: 11px; color: #666; margin-bottom: 2px;">Detected: <span style="font-family: JetBrains Mono, monospace; color: #333;">1 Jun 2026, 10:40 UTC</span></div>
                <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Source: Sentinel-1 SAR</div>
                <div style="width: 100%; height: 60px; background: linear-gradient(135deg, rgba(255,68,68,0.3), rgba(255,100,50,0.15)); border: 1px solid rgba(255,68,68,0.3); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #999;">SAR Thumbnail</div>
              </div>`
            )
            .addTo(map);
          popupsRef.current.push(popup);
        }
      });
      map.on('mouseenter', 'slick-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'slick-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    }

    // Drift trajectory + origin zone
    if (layers.origin) {
      const driftGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [63.6, 18.3],
                [63.75, 18.2],
                [63.9, 18.1],
                [64.0, 18.0],
              ],
            },
          },
        ],
      };

      map.addSource('drift-trajectory', { type: 'geojson', data: driftGeoJSON });
      map.addLayer({
        id: 'drift-trajectory',
        type: 'line',
        source: 'drift-trajectory',
        paint: {
          'line-color': '#FF8C00',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });

      // Arrowhead at spill end
      const arrowGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Polygon' as const,
              coordinates: [
                [
                  [64.0, 18.0],
                  [63.97, 18.02],
                  [63.97, 17.98],
                  [64.0, 18.0],
                ],
              ],
            },
          },
        ],
      };
      map.addSource('drift-arrow', { type: 'geojson', data: arrowGeoJSON });
      map.addLayer({
        id: 'drift-arrow',
        type: 'fill',
        source: 'drift-arrow',
        paint: {
          'fill-color': '#FF8C00',
          'fill-opacity': 0.8,
        },
      });

      // Origin zone circle
      const originCenter: [number, number] = [63.6, 18.3];
      const radius = 0.15;
      const points: number[][] = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * 2 * Math.PI;
        points.push([
          originCenter[0] + radius * Math.cos(angle),
          originCenter[1] + radius * Math.sin(angle),
        ]);
      }
      const originGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Polygon' as const, coordinates: [points] },
          },
        ],
      };

      map.addSource('origin-fill', { type: 'geojson', data: originGeoJSON });
      map.addLayer({
        id: 'origin-fill',
        type: 'fill',
        source: 'origin-fill',
        paint: {
          'fill-color': '#FFD700',
          'fill-opacity': 0.1,
        },
      });
      map.addLayer({
        id: 'origin-outline',
        type: 'line',
        source: 'origin-fill',
        paint: {
          'line-color': '#FFD700',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      });
    }

    // Currents
    if (layers.currents) {
      const lineFeatures: GeoJSON.Feature[] = [];
      for (let i = 0; i < 5; i++) {
        const coords: number[][] = [];
        const baseLat = 17.5 + i * 0.3;
        for (let lon = 62; lon <= 67; lon += 0.1) {
          coords.push([lon, baseLat + Math.sin(lon * 0.5 + i) * 0.15]);
        }
        lineFeatures.push({
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'LineString' as const, coordinates: coords },
        });
      }
      map.addSource('currents', {
        type: 'geojson',
        data: { type: 'FeatureCollection' as const, features: lineFeatures },
      });
      map.addLayer({
        id: 'currents',
        type: 'line',
        source: 'currents',
        paint: { 'line-color': '#00FF88', 'line-width': 1.5, 'line-opacity': 0.3 },
      });
    }

    // Wind
    if (layers.wind) {
      const windFeatures: GeoJSON.Feature[] = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 6; j++) {
          const lon = 62 + (i / 7) * 5;
          const lat = 16 + (j / 5) * 4;
          windFeatures.push({
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [lon, lat],
                [lon + 0.3, lat + 0.15],
              ],
            },
          });
        }
      }
      map.addSource('wind', {
        type: 'geojson',
        data: { type: 'FeatureCollection' as const, features: windFeatures },
      });
      map.addLayer({
        id: 'wind',
        type: 'line',
        source: 'wind',
        paint: { 'line-color': '#A855F7', 'line-width': 1, 'line-opacity': 0.25 },
      });
    }
  }, [vessels, primeSuspectName, layers, mapReady, onVesselClick]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0 rounded-lg overflow-hidden" />

      {/* Layer toggles */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[55%] z-10">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLayers((p) => ({ ...p, [l.key]: !p[l.key] }))}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[0.625rem] font-medium uppercase tracking-wider transition-all border ${
              layers[l.key]
                ? 'bg-[rgba(255,255,255,0.85)] text-[#0a1628] border-[#0FB9B1]'
                : 'bg-[rgba(10,22,40,0.6)] text-muted border-transparent'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: layers[l.key] ? l.color : '#3a4a5a' }}
            />
            {l.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 glass-panel px-3 py-2 z-10 space-y-1.5">
        <div className="section-label mb-1">Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-[#FF4444] border border-[#FF4444]" />
          <span className="text-[0.625rem] text-white/80">Detected Spill</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="14" height="3" className="shrink-0">
            <line
              x1="0"
              y1="1.5"
              x2="14"
              y2="1.5"
              stroke="#FF8C00"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
          </svg>
          <span className="text-[0.625rem] text-white/80">Drift Trajectory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#0FB9B1] border border-white" />
          <span className="text-[0.625rem] text-white/80">Vessel (Normal)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF8C00] border border-white" />
          <span className="text-[0.625rem] text-white/80">Vessel (Suspicious)</span>
        </div>
      </div>

      {/* Scale bar */}
      <div className="absolute bottom-3 right-14 z-10 glass-panel px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="w-16 h-0.5 bg-white/60" />
            <div className="flex justify-between w-16">
              <div className="w-px h-1.5 bg-white/60" />
              <div className="w-px h-1.5 bg-white/60" />
            </div>
          </div>
          <span className="metric-value text-[0.625rem] text-white/80">100 km</span>
        </div>
      </div>

      {/* Compass */}
      <div className="absolute top-3 right-14 z-10 glass-panel w-8 h-8 flex items-center justify-center rounded-full">
        <span className="text-xs font-bold text-[#00D4FF]">N</span>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-[#00D4FF]" />
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute pointer-events-none glass-panel px-2.5 py-1.5 text-xs z-20 left-1/2 -translate-x-1/2 top-12">
          <div className="font-semibold text-white">{hovered.name}</div>
          <div className="text-muted text-[0.625rem]">
            MMSI {hovered.mmsi} · {hovered.speed} kn
          </div>
        </div>
      )}
    </div>
  );
}
