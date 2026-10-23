import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { get, own } from "../repositories/domain.repository.js";
import { getForecast } from "../services/weather/forecast.service.js";
import { searchWeatherLocations } from "../services/weather/locations.service.js";
import { weatherPsgcLocations, weatherPsgcPoint } from "../services/weather/psgc-locations.service.js";
import { fail } from "../utils/errors.js";
import { weatherPsgcQuery, weatherQuery, weatherSearchQuery } from "../validators/weather.js";

export async function getWeatherController(db: DB, req: ActorRequest) {
  const query = weatherQuery.parse(req.query);
  if ("psgcCode" in query) {
    if (req.actor.role === "customer")
      fail(403, "Supplier access required for PSGC weather", "forbidden");
    const point = weatherPsgcPoint(query.psgcCode);
    return getForecast(point.latitude, point.longitude);
  }
  if ("connectionId" in query) {
    if (req.actor.role !== "customer")
      fail(403, "Select a city for weather.", "forbidden");
    const connection = await get(db, "connection", query.connectionId);
    own(connection, req.actor);
    if (connection.latitude === null || connection.longitude === null)
      fail(
        422,
        "This connection has no coordinates. Search for a city instead.",
        "location_unavailable",
      );
    return getForecast(connection.latitude, connection.longitude);
  }
  return getForecast(query.latitude, query.longitude);
}

export async function searchWeatherController(_db: DB, req: ActorRequest) {
  return searchWeatherLocations(weatherSearchQuery.parse(req.query).q);
}
export async function weatherPsgcController(_db: DB, req: ActorRequest) {
  weatherPsgcQuery.parse(req.query);
  return weatherPsgcLocations();
}
