// Exact geographic signatures of the original seed. These intentionally retain
// the old fictional Metro Manila locations solely for conservative v1 preflight.
export const legacyVersion = "aqours-demo-v1";
export const seedCategories = [
  "outage",
  "low_pressure",
  "leak",
  "water_quality",
];
export const fixtureId = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function legacyZone(index: number) {
  const lon = 120.98 + index * 0.025,
    lat = 14.57;
  return {
    code: `DEMO-${index + 1}`,
    name: ["Demo Riverside", "Demo Hillcrest", "Demo Lakeside"][index],
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [lon, lat],
          [lon + 0.02, lat],
          [lon + 0.02, lat + 0.03],
          [lon, lat + 0.03],
          [lon, lat],
        ],
      ],
    },
  };
}
export function legacyConnection(index: number) {
  return {
    customerId: fixtureId(12 + index),
    reference: `DEMO-CON-${String(index + 1).padStart(3, "0")}`,
    address: `${index + 1} Fictional Demo Lane, ${legacyZone(index % 3).name}`,
    structuredAddress: null,
    zoneId: index === 11 ? null : fixtureId(100 + (index % 3)),
    zoneConfirmed: index !== 11,
    latitude: index === 11 ? null : 14.58 + index * 0.0005,
    longitude: index === 11 ? null : 120.99 + (index % 3) * 0.025,
  };
}
export function legacyReport(index: number) {
  const connection = legacyConnection(index);
  const { reference: _reference, ...location } = connection;
  return {
    ...location,
    connectionId: fixtureId(200 + index),
    description: `Fictional demonstration report ${index + 1}: ${seedCategories[index % 4]}.`,
    category: seedCategories[index % 4],
    locationSource: "saved_address",
    accuracy: null,
    locationConfirmed: index !== 11,
    locationReview: index === 11,
  };
}
export function legacySite(index: number) {
  return {
    name: ["Demo Riverside Pickup", "Demo Hillcrest Pickup"][index],
    address: `${index + 1} Fictional Distribution Road`,
    structuredAddress: null,
    latitude: 14.59 + index * 0.01,
    longitude: 121.0 + index * 0.01,
    demo: true,
  };
}
