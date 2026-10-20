/** Public demo basemap. Explicit client style URLs still take precedence. */
export function streetMapStyle(tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png') {
  return {
    version: 8 as const,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: { streets: { type: 'raster' as const, tiles: [tileUrl], tileSize: 256, maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } },
    layers: [{ id: 'streets', type: 'raster' as const, source: 'streets' }],
  };
}
