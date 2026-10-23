import type { Express } from "express";
import {
  getWeatherController,
  searchWeatherController,
  weatherPsgcController,
} from "../controllers/weather.controller.js";
import { route } from "../middleware/endpoint.js";

export function weatherRoutes(app: Express) {
  route(app, "get", "/weather/locations", "any", searchWeatherController);
  route(app, "get", "/weather/psgc-locations", "staff", weatherPsgcController);
  route(app, "get", "/weather", "any", getWeatherController);
}
