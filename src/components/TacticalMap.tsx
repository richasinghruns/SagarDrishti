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
  { key: 'ais', label: 'AIS Ships', color: '#00D4FF' },
  { key: 'slick', label: 'Satellite Slick', color: '#FF4444' },
  { key: 'origin', label: 'Origin Zone', color: '#FFD700' },
  { key: 'currents', label: 'Currents', color: '#00FF88' },
  { key: 'wind', label: 'Wind', color: '#A855F7' },
];

const CARTO_API_KEY =
  'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfbXg1NzU1dzYiLCJqdGkiOiI0MThjNzBiOSJ9.9vU-qq_vpHmoB1gKQU1xlHsDdbAlfLUytPgfzLGQRBk';

const CARTO_STYLE_URL = `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json?api_key=${CARTO_API_KEY}`;

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

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_STYLE_URL,
      center: [103.8, 1.25],
      zoom: 9,
      attributionControl: false,
      transformRequest: (url, resourceType) => {
        // Append API key to CARTO tile and style requests
        if (url.includes('cartocdn.com') || url.includes('carto.com')) {
          const sep = url.includes('?') ? '&' : '?';
          return {
            url: `${url}${sep}api_key=${CARTO_API_KEY}`,
            headers: { Authorization: `Bearer ${CARTO_API_KEY}` },
          };
        }
        return { url };
      },
    });

    map.on('load', () => {
      setMapReady(true);
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Update vessel markers and overlays when data or layers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove old sources/layers
    ['vessels-normal', 'vessels-anomaly', 'vessels-prime', 'slick-fill', 'slick-outline', 'origin-fill', 'origin-outline', 'currents', 'wind'].forEach(
      (id) => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      }
    );

    // AIS vessels
    if (layers.ais) {
      const normalFeatures = vessels
        .filter((v) => !v.is_anomaly && v.anomaly_score <= 0.5 && v.name !== primeSuspectName && !v.is_prime_suspect)
        .map((v) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
          properties: { name: v.name, mmsi: v.mmsi, speed: v.speed },
        }));

      const anomalyFeatures = vessels
        .filter((v) => (v.is_anomaly || v.anomaly_score > 0.5) && v.name !== primeSuspectName && !v.is_prime_suspect)
        .map((v) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
          properties: { name: v.name, mmsi: v.mmsi, speed: v.speed },
        }));

      const primeFeatures = vessels
        .filter((v) => v.is_prime_suspect || v.name === primeSuspectName)
        .map((v) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
          properties: { name: v.name, mmsi: v.mmsi, speed: v.speed },
        }));

      if (normalFeatures.length > 0) {
        map.addSource('vessels-normal', { type: 'geojson', data: { type: 'FeatureCollection', features: normalFeatures } });
        map.addLayer({
          id: 'vessels-normal',
          type: 'circle',
          source: 'vessels-normal',
          paint: {
            'circle-radius': 4,
            'circle-color': '#00D4FF',
            'circle-opacity': 0.8,
            'circle-stroke-color': '#00D4FF',
            'circle-stroke-width': 1,
          },
        });
      }

      if (anomalyFeatures.length > 0) {
        map.addSource('vessels-anomaly', { type: 'geojson', data: { type: 'FeatureCollection', features: anomalyFeatures } });
        map.addLayer({
          id: 'vessels-anomaly',
          type: 'circle',
          source: 'vessels-anomaly',
          paint: {
            'circle-radius': 6,
            'circle-color': '#FF4444',
            'circle-opacity': 0.9,
            'circle-stroke-color': '#FF4444',
            'circle-stroke-width': 2,
            'circle-stroke-opacity': 0.4,
          },
        });
      }

      if (primeFeatures.length > 0) {
        map.addSource('vessels-prime', { type: 'geojson', data: { type: 'FeatureCollection', features: primeFeatures } });
        map.addLayer({
          id: 'vessels-prime',
          type: 'circle',
          source: 'vessels-prime',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FFD700',
            'circle-opacity': 1,
            'circle-stroke-color': '#FFD700',
            'circle-stroke-width': 3,
            'circle-stroke-opacity': 0.5,
          },
        });
      }

      // Hover and click interactions
      ['vessels-normal', 'vessels-anomaly', 'vessels-prime'].forEach((layerId) => {
        if (!map.getLayer(layerId)) return;
        map.on('mousemove', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties;
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
          if (e.features && e.features.length > 0 && onVesselClick) {
            const props = e.features[0].properties;
            const vessel = vessels.find((v) => v.name === props.name);
            if (vessel) onVesselClick(vessel);
          }
        });
      });
    }

    // Satellite slick
    if (layers.slick) {
      const slickCenter = [103.84, 1.26];
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
                  [slickCenter[0] - 0.05, slickCenter[1] - 0.03],
                  [slickCenter[0] + 0.05, slickCenter[1] - 0.02],
                  [slickCenter[0] + 0.06, slickCenter[1] + 0.03],
                  [slickCenter[0] - 0.04, slickCenter[1] + 0.04],
                  [slickCenter[0] - 0.05, slickCenter[1] - 0.03],
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
          'fill-opacity': 0.2,
        },
      });
      map.addLayer({
        id: 'slick-outline',
        type: 'line',
        source: 'slick-fill',
        paint: {
          'line-color': '#FF4444',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      });
    }

    // Origin zone
    if (layers.origin) {
      const originCenter = [103.83, 1.27];
      const radius = 0.015;
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
          'fill-opacity': 0.08,
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
        const baseLat = 1.1 + i * 0.08;
        for (let lon = 103.3; lon <= 104.3; lon += 0.02) {
          coords.push([lon, baseLat + Math.sin(lon * 5 + i) * 0.01]);
        }
        lineFeatures.push({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: coords } });
      }
      map.addSource('currents', { type: 'geojson', data: { type: 'FeatureCollection' as const, features: lineFeatures } });
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
          const lon = 103.3 + (i / 7) * 1.0;
          const lat = 0.85 + (j / 5) * 0.8;
          windFeatures.push({
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'LineString' as const, coordinates: [[lon, lat], [lon + 0.02, lat + 0.008]] },
          });
        }
      }
      map.addSource('wind', { type: 'geojson', data: { type: 'FeatureCollection' as const, features: windFeatures } });
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
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[60%] z-10">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLayers((p) => ({ ...p, [l.key]: !p[l.key] }))}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[0.625rem] font-medium uppercase tracking-wider transition-all border ${
              layers[l.key]
                ? 'bg-[rgba(0,212,255,0.1)] text-white border-cyan-dim'
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

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute pointer-events-none glass-panel px-2.5 py-1.5 text-xs z-20 left-1/2 bottom-3">
          <div className="font-semibold text-white">{hovered.name}</div>
          <div className="text-muted text-[0.625rem]">
            MMSI {hovered.mmsi} · {hovered.speed} kn
          </div>
        </div>
      )}
    </div>
  );
}
