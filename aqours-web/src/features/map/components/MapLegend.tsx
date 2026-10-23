import { reportCategories } from '../utils/report-categories';

export function MapLegend() {
  return <div className="map-legend" aria-label="Map legend">
    <ul className="map-category-legend" aria-label="Report types">
      {Object.entries(reportCategories).map(([category, { label, color }]) => <li key={category}>
        <span className="map-legend-swatch" style={{ backgroundColor: color }} aria-hidden="true" />{label}
      </li>)}
    </ul>
    <p>Marker colors show report type. Priority is shown in report details and popups.</p>
    <p>Clusters: gray · Service zones: gray · Published incident areas: teal · Official advisory areas: amber.</p>
  </div>;
}
