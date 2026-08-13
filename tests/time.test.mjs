import test from "node:test";
import assert from "node:assert/strict";

import {
  formatLap,
  normalizeElapsedMilliseconds,
  splitStopwatchTime
} from "../site/time.js";

test("normalizes invalid elapsed values to zero", () => {
  assert.equal(normalizeElapsedMilliseconds(-1), 0);
  assert.equal(normalizeElapsedMilliseconds(Number.NaN), 0);
  assert.equal(normalizeElapsedMilliseconds(Number.POSITIVE_INFINITY), 0);
  assert.equal(normalizeElapsedMilliseconds(0), 0);
});

test("formats zero stopwatch time", () => {
  assert.deepEqual(splitStopwatchTime(0), {
    main: "00:00",
    fraction: ".00"
  });
});

test("formats minutes, seconds, and hundredths", () => {
  assert.deepEqual(splitStopwatchTime(125_678), {
    main: "02:05",
    fraction: ".67"
  });
});

test("formats hours when elapsed time reaches one hour", () => {
  assert.deepEqual(splitStopwatchTime(3_661_239), {
    main: "01:01:01",
    fraction: ".23"
  });
});

test("formats lap values", () => {
  assert.equal(formatLap(125_678), "02:05.67");
  assert.equal(formatLap(3_661_239), "1:01:01.23");
});
