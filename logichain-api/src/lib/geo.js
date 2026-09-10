/**
 * Test point-dans-polygone (ray casting), utilise pour filtrer l'historique
 * de scans par zone geographique de l'evenement. Implementation native,
 * aucune dependance geospatiale externe.
 */
function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

module.exports = { pointInPolygon };
