import assert from "node:assert/strict";
import test from "node:test";

import {
  createDayRanges,
  longTripGenerationPolicy,
} from "../lib/ai/generate-trip-in-chunks";

test("long trips use small ordered chunks with bounded retry work", () => {
  assert.deepEqual(createDayRanges(14), [
    { startDay: 1, endDay: 3 },
    { startDay: 4, endDay: 6 },
    { startDay: 7, endDay: 9 },
    { startDay: 10, endDay: 12 },
    { startDay: 13, endDay: 14 },
  ]);
  assert.equal(longTripGenerationPolicy.concurrency, 1);
  assert.equal(longTripGenerationPolicy.maxAttemptsPerModel, 1);
  assert.equal(longTripGenerationPolicy.maxRequestsPerChunk, 2);
  assert.equal(longTripGenerationPolicy.schemaRepairAttempts, 2);
  assert.equal(longTripGenerationPolicy.apiAttempts, 3);
});

test("a 15-day trip keeps the final chunk within the requested duration", () => {
  assert.deepEqual(createDayRanges(15).at(-1), {
    startDay: 13,
    endDay: 15,
  });
});
