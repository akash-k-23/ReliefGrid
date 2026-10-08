import test from "node:test";
import assert from "node:assert/strict";
import { LiveDisasterFeed, normalizeFeatureCollection } from "../services/disasterFeedService.js";

const featureCollection = {
  type: "FeatureCollection",
  metadata: { generated: 1790661747000 },
  features: [{
    type: "Feature",
    id: "us123",
    properties: {
      title: "M 5.2 - Test region",
      place: "Test region",
      mag: 5.2,
      time: 1790661249867,
      updated: 1790661403890,
      alert: "orange",
      tsunami: 0,
      url: "https://earthquake.usgs.gov/earthquakes/eventpage/us123",
    },
    geometry: { type: "Point", coordinates: [12.5, 45.2, 10] },
  }],
};

test("normalizes verified GeoJSON fields without fabricating unsupported events", () => {
  const events = normalizeFeatureCollection(featureCollection);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "earthquake");
  assert.equal(events[0].severity, "orange PAGER alert");
  assert.equal(events[0].latitude, 45.2);
  assert.equal(events[0].sourceUrl, featureCollection.features[0].properties.url);
});

test("rejects malformed feed payloads and drops invalid coordinates", () => {
  assert.throws(() => normalizeFeatureCollection({ features: [] }), /valid GeoJSON/);
  assert.deepEqual(normalizeFeatureCollection({
    type: "FeatureCollection",
    features: [{ properties: {}, geometry: { coordinates: [500, 200] } }],
  }), []);
});

test("retains the last successful cache when an upstream request fails", async () => {
  let fail = false;
  const feed = new LiveDisasterFeed({
    fetchImpl: async () => {
      if (fail) throw new Error("offline");
      return { ok: true, status: 200, headers: new Headers(), json: async () => featureCollection };
    },
  });

  const first = await feed.refresh();
  assert.equal(first.status, "live");
  assert.equal(first.events.length, 1);

  fail = true;
  const second = await feed.refresh();
  assert.equal(second.status, "stale");
  assert.equal(second.events.length, 1);
  assert.equal(second.lastUpdated, first.lastUpdated);
  assert.ok(second.error);
});

test("sends validators and reuses cache for an unchanged feed", async () => {
  let callCount = 0;
  const feed = new LiveDisasterFeed({
    fetchImpl: async (_url, options) => {
      callCount += 1;
      if (callCount === 1) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ ETag: '"rev-1"' }),
          json: async () => featureCollection,
        };
      }
      assert.equal(options.headers["If-None-Match"], '"rev-1"');
      return { ok: false, status: 304, headers: new Headers(), json: async () => ({}) };
    },
  });

  await feed.refresh();
  const unchanged = await feed.refresh();
  assert.equal(unchanged.status, "live");
  assert.equal(unchanged.events.length, 1);
  assert.equal(callCount, 2);
});