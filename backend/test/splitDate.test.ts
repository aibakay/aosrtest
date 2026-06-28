import assert from "node:assert/strict";
import { test } from "node:test";
import { splitDate } from "../src/services/templateService";

test("splits ISO date into day/month-word/year", () => {
  const out = splitDate("2026-06-28", "д", "м", "г");
  assert.equal(out["д"], "28");
  assert.equal(out["м"], "июня");
  assert.equal(out["г"], "2026");
});

test("zero-pads single-digit days", () => {
  const out = splitDate("2026-06-01", "д", "м", "г");
  assert.equal(out["д"], "01");
});

test("returns empty strings for invalid dates", () => {
  const out = splitDate("not-a-date", "д", "м", "г");
  assert.equal(out["д"], "");
  assert.equal(out["м"], "");
  assert.equal(out["г"], "");
});

test("uses genitive month form (января, not январь)", () => {
  const out = splitDate("2026-01-15", "д", "м", "г");
  assert.equal(out["м"], "января");
});
