import { describe, it, expect } from "vitest";
import { getScreeningDuration } from "./data";

describe("getScreeningDuration", () => {
  it("returns screening.duration when set", () => {
    const screening = { duration: 75 };
    const film = { runtime: 120 };
    expect(getScreeningDuration(screening, film)).toBe(75);
  });

  it("falls back to film.runtime when screening has no duration", () => {
    const screening = {};
    const film = { runtime: 158 };
    expect(getScreeningDuration(screening, film)).toBe(158);
  });

  it("returns 90 when neither screening.duration nor film.runtime exists", () => {
    const screening = {};
    const film = {};
    expect(getScreeningDuration(screening, film)).toBe(90);
  });

  it("returns 90 when film is undefined", () => {
    const screening = {};
    expect(getScreeningDuration(screening, undefined)).toBe(90);
  });

  it("returns 90 when film is null", () => {
    const screening = {};
    expect(getScreeningDuration(screening, null)).toBe(90);
  });

  it("prefers screening.duration over film.runtime", () => {
    const screening = { duration: 60 };
    const film = { runtime: 120 };
    expect(getScreeningDuration(screening, film)).toBe(60);
  });
});
