import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ZoneDTO } from '../types/dtos';

interface Props {
  existingZones: ZoneDTO[];
  centerLng?: number;
  centerLat?: number;
  resetKey: number;
  onPointsChange: (points: [number, number][]) => void;
}

/**
 * Carte interactive pour le decoupage cartographique des zones : Leaflet +
 * tuiles OpenStreetMap dans une WebView (gratuit, aucune cle API Google/
 * Apple a configurer, contrairement a react-native-maps). Un tap sur la
 * carte ajoute un sommet au polygone en cours ; les zones existantes de
 * l'evenement sont affichees en superposition.
 *
 * Composant purement presentationnel : la construction du polygone final
 * (fermeture, validation) reste geree par l'ecran appelant via addZone().
 */
function buildMapHtml(existingZones: ZoneDTO[], centerLng: number, centerLat: number): string {
  const zonesJson = JSON.stringify(
    existingZones.map((z) => ({ name: z.name, coordinates: z.area.coordinates[0] }))
  ).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .zone-label { font-size: 11px; font-weight: 600; color: #1565c0; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${centerLat}, ${centerLng}], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var existingZones = ${zonesJson};
  existingZones.forEach(function (zone) {
    var latlngs = zone.coordinates.map(function (c) { return [c[1], c[0]]; });
    L.polygon(latlngs, { color: '#1565c0', fillOpacity: 0.15 }).addTo(map).bindTooltip(zone.name, { permanent: false });
  });

  var points = [];
  var polygon = null;
  var markers = [];

  function redraw() {
    if (polygon) { map.removeLayer(polygon); polygon = null; }
    markers.forEach(function (m) { map.removeLayer(m); });
    markers = [];
    points.forEach(function (p) {
      var m = L.circleMarker([p[1], p[0]], { radius: 6, color: '#c62828', fillColor: '#c62828', fillOpacity: 1 }).addTo(map);
      markers.push(m);
    });
    if (points.length >= 2) {
      var latlngs = points.map(function (p) { return [p[1], p[0]]; });
      polygon = L.polygon(latlngs, { color: '#2e7d32', fillOpacity: 0.25 }).addTo(map);
    }
    send();
  }

  function send() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ points: points }));
  }

  map.on('click', function (e) {
    points.push([e.latlng.lng, e.latlng.lat]);
    redraw();
  });

  send();
</script>
</body>
</html>`;
}

export default function ZoneMapPicker({ existingZones, centerLng = 1.149, centerLat = 49.024, resetKey, onPointsChange }: Props) {
  const html = useMemo(
    () => buildMapHtml(existingZones, centerLng, centerLat),
    [existingZones, centerLng, centerLat, resetKey]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (Array.isArray(data.points)) onPointsChange(data.points);
      } catch {
        // message malforme : ignore
      }
    },
    [onPointsChange]
  );

  return (
    <View style={styles.container}>
      {/* key={resetKey} force le remontage complet -> repart d'un polygone vide */}
      <WebView key={resetKey} originWhitelist={['*']} source={{ html }} onMessage={handleMessage} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 340, borderRadius: 8, overflow: 'hidden', marginVertical: 8 },
  webview: { flex: 1 }
});
