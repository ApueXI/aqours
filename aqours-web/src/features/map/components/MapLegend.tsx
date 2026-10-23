import { reportSymbol } from '../utils/report-symbols';
import { reportCategories } from '../utils/report-categories';

export function MapLegend() {
  return <div className="map-legend" aria-label="Map legend">
    <ul className="map-category-legend" aria-label="Report types">
      {Object.entries(reportCategories).map(([category, { label, color }]) => <li key={category}>
        <span className="map-legend-swatch" style={{ backgroundColor: color }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: reportSymbol(category as keyof typeof reportCategories) }} />{label}
      </li>)}
    </ul>
    <p>Issue icons show open report types. Gray customer icons mean no open reports in the current filters; they do not confirm safe water.</p>
    <p>Circles count unique customers. Mixed issue colors: red first, then purple, blue and amber; gray means no open reports in current filters. Reviewed priority stays in report details.</p>
  </div>;
}
