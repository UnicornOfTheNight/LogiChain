import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ZoneDTO, StopDTO } from '../types/dtos';

interface Props {
  zones: ZoneDTO[];
  stops: StopDTO[];
  centerLng?: number;
  centerLat?: number;
}

/**
 * Carte en lecture seule (Leaflet + OpenStreetMap dans une WebView, aucune
 * cle API requise) affichant les zones de l'evenement et les arrets des
 * feuilles de route : integration cartographique des donnees GeoJSON pour
 * le dashboard operationnel des agents de terrain.
 */
function buildHtml(zones: ZoneDTO[], stops: StopDTO[], centerLng: number, centerLat: number): string {
  const zonesJson = JSON.stringify(
    zones.map((z) => ({ name: z.name, coordinates: z.area.coordinates[0] }))
  ).replace(/</g, '\\u003c');

  const stopsJson = JSON.stringify(
    stops.map((s, i) => ({
      order: i + 1,
      label: s.label,
      lng: s.location.coordinates[0],
      lat: s.location.coordinates[1]
    }))
  ).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .stop-badge {
    background: #1565c0; color: #fff; border-radius: 50%; width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center; font-weight: bold;
    font-size: 12px; border: 2px solid #fff;
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${centerLat}, ${centerLng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var zones = ${zonesJson};
  zones.forEach(function (zone) {
    var latlngs = zone.coordinates.map(function (c) { return [c[1], c[0]]; });
    L.polygon(latlngs, { color: '#1565c0', fillOpacity: 0.12 }).addTo(map).bindTooltip(zone.name);
  });

  var stops = ${stopsJson};
  var routeLine = [];
  stops.forEach(function (stop) {
    var icon = L.divIcon({ className: '', html: '<div class="stop-badge">' + stop.order + '</div>', iconSize: [24, 24] });
    L.marker([stop.lat, stop.lng], { icon: icon }).addTo(map).bindPopup(stop.label);
    routeLine.push([stop.lat, stop.lng]);
  });
  if (routeLine.length >= 2) {
    L.polyline(routeLine, { color: '#2e7d32', dashArray: '6 6' }).addTo(map);
  }
</script>
</body>
</html>`;
}

export default function ItineraryMapView({ zones, stops, centerLng = 1.149, centerLat = 49.024 }: Props) {
  const html = useMemo(
    () => buildHtml(zones, stops, centerLng, centerLat),
    [zones, stops, centerLng, centerLat]
  );

  return (
    <View style={styles.container}>
      <WebView originWhitelist={['*']} source={{ html }} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 240, borderRadius: 8, overflow: 'hidden', marginVertical: 8 },
  webview: { flex: 1 }
});
