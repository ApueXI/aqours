import { addressFields } from "../services/location/psgc-catalog.service.js";

export const seedVersion = "aqours-demo-laguna-v2";
// PSGC supplies administrative names/codes, never geometry. These synthetic points
// and small rectangles illustrate service zones; they are not official boundaries.
// Representative locality references (approximate centers, not geocoded homes):
// https://mapcarta.com/36439088 (Bagong Kalsada)
// https://mapcarta.com/32291410 (Batong Malake)
// https://www.philatlas.com/luzon/r04a/laguna/santa-rosa/balibago.html
export const lagunaPlaces = [
  {
    name: "Demo Calamba",
    barangayCode: "0403405001",
    latitude: 14.1679,
    longitude: 121.1951,
  },
  {
    name: "Demo Los Baños",
    barangayCode: "0403411004",
    latitude: 14.1674,
    longitude: 121.2433,
  },
  {
    name: "Demo Santa Rosa",
    barangayCode: "0403428002",
    latitude: 14.2946,
    longitude: 121.1054,
  },
] as const;

export function seedZone(index: number) {
  const { name, latitude: lat, longitude: lon } = lagunaPlaces[index]!;
  const delta = 0.001;
  return {
    name,
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [lon - delta, lat - delta],
          [lon + delta, lat - delta],
          [lon + delta, lat + delta],
          [lon - delta, lat + delta],
          [lon - delta, lat - delta],
        ],
      ],
    },
  };
}

export function seedConnectionLocation(index: number) {
  const place = lagunaPlaces[index % 3]!;
  const offset = Math.floor(index / 3) * 0.00015;
  return {
    ...addressFields({
      structuredAddress: {
        barangayCode: place.barangayCode,
        streetDetails: `${index + 1} Fictional Demo Lane`,
      },
    }),
    latitude: index === 11 ? null : place.latitude + offset,
    longitude: index === 11 ? null : place.longitude + offset,
  };
}

export function seedSiteLocation(index: number) {
  const place = lagunaPlaces[index]!;
  return {
    name: `${place.name} Pickup`,
    ...addressFields({
      structuredAddress: {
        barangayCode: place.barangayCode,
        streetDetails: `${index + 1} Fictional Distribution Road`,
      },
    }),
    latitude: place.latitude,
    longitude: place.longitude,
  };
}
