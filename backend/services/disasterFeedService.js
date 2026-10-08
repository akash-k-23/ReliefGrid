const DEFAULT_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";
const DEFAULT_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_FEATURES = 500;

const validCoordinate = (latitude, longitude) =>
  Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
  Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;

export function normalizeFeatureCollection(payload) {
  if (payload?.type !== "FeatureCollection" || !Array.isArray(payload.features) || payload.features.length > MAX_FEATURES) {
    throw new Error("USGS feed response was not a valid GeoJSON feature collection");
  }

  return payload.features.flatMap((feature) => {
    const properties = feature?.properties;
    const coordinates = feature?.geometry?.coordinates;
    const longitude = Number(coordinates?.[0]);
    const latitude = Number(coordinates?.[1]);
    if (!properties || !validCoordinate(latitude, longitude)) return [];

    const tsunami = Number(properties.tsunami) > 0;
    const magnitude = Number.isFinite(Number(properties.mag)) ? Number(properties.mag) : null;
    const reportedAlert = typeof properties.alert === "string" && properties.alert.trim()
      ? `${properties.alert.trim()} PAGER alert`
      : magnitude === null ? "Severity not reported" : `Magnitude ${magnitude}; PAGER alert not reported`;
    const sourceUrl = typeof properties.url === "string" && properties.url.startsWith("https://earthquake.usgs.gov/")
      ? properties.url
      : null;

    return [{
      id: String(feature.id || properties.code || `${properties.time}-${latitude}-${longitude}`),
      type: tsunami ? "tsunami" : "earthquake",
      title: String(properties.title || "Earthquake event").slice(0, 240),
      location: String(properties.place || "Location not reported").slice(0, 240),
      severity: reportedAlert,
      description: [
        magnitude === null ? "Magnitude not reported" : `Magnitude ${magnitude}`,
        tsunami ? "USGS tsunami flag is set" : "USGS tsunami flag is not set",
      ].join(". "),
      magnitude,
      latitude,
      longitude,
      startedAt: Number.isFinite(Number(properties.time)) ? new Date(Number(properties.time)).toISOString() : null,
      updatedAt: Number.isFinite(Number(properties.updated)) ? new Date(Number(properties.updated)).toISOString() : null,
      source: "USGS Earthquake Hazards Program",
      sourceUrl,
    }];
  });
}

export class LiveDisasterFeed {
  constructor({
    fetchImpl = globalThis.fetch,
    feedUrl = DEFAULT_FEED_URL,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
    now = () => new Date(),
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.feedUrl = feedUrl;
    this.refreshIntervalMs = refreshIntervalMs;
    this.now = now;
    this.refreshPromise = null;
    this.timer = null;
    this.etag = null;
    this.lastModified = null;
    this.cache = {
      events: [],
      lastUpdated: null,
      sourceUpdatedAt: null,
      checkedAt: null,
      status: "unavailable",
      error: null,
      source: "USGS Earthquake Hazards Program",
      sourceUrl: this.feedUrl,
      attribution: "Earthquake data from the U.S. Geological Survey (USGS).",
    };
  }

  getSnapshot() {
    return { ...this.cache, events: this.cache.events };
  }

  start() {
    if (this.timer) return;
    this.refresh().catch(() => {});
    this.timer = setInterval(() => this.refresh().catch(() => {}), this.refreshIntervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async refresh() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.fetchAndUpdate();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async fetchAndUpdate() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = { Accept: "application/geo+json, application/json" };
    if (this.etag) headers["If-None-Match"] = this.etag;
    if (this.lastModified) headers["If-Modified-Since"] = this.lastModified;

    try {
      const response = await this.fetchImpl(this.feedUrl, { headers, signal: controller.signal });
      const checkedAt = this.now().toISOString();
      if (response.status === 304 && this.cache.lastUpdated) {
        this.cache = { ...this.cache, checkedAt, status: "live", error: null };
        return this.getSnapshot();
      }
      if (!response.ok) throw new Error(`USGS feed returned HTTP ${response.status}`);

      const payload = await response.json();
      const events = normalizeFeatureCollection(payload);
      const generated = Number(payload.metadata?.generated);
      this.etag = response.headers?.get?.("etag") || this.etag;
      this.lastModified = response.headers?.get?.("last-modified") || this.lastModified;
      this.cache = {
        ...this.cache,
        events,
        lastUpdated: checkedAt,
        sourceUpdatedAt: Number.isFinite(generated) ? new Date(generated).toISOString() : null,
        checkedAt,
        status: "live",
        error: null,
      };
      return this.getSnapshot();
    } catch (error) {
      this.cache = {
        ...this.cache,
        checkedAt: this.now().toISOString(),
        status: this.cache.lastUpdated ? "stale" : "unavailable",
        error: error.name === "AbortError" ? "USGS feed request timed out" : "USGS feed is temporarily unavailable",
      };
      return this.getSnapshot();
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const liveDisasterFeed = new LiveDisasterFeed({
  refreshIntervalMs: Math.max(60000, Number(process.env.DISASTER_REFRESH_INTERVAL_MS) || DEFAULT_REFRESH_INTERVAL_MS),
});