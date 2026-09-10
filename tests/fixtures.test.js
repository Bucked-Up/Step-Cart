import { describe, expect, it } from "vitest";
import { FIXTURE_IDS, loadFixture } from "./helpers/harness.js";

// A missing or truncated capture otherwise surfaces as a confusing render failure.
describe("captured API fixtures", () => {
  FIXTURE_IDS.forEach((id) => {
    it(`product ${id} has the shape fetchProducts expects`, () => {
      const { product } = loadFixture(id);
      // The API returns ids as strings, which is why the library compares with ==.
      expect(Number(product.id)).toBe(id);
      expect(product.price).toMatch(/^\$\d/);
      expect(Array.isArray(product.options)).toBe(true);
      expect(Object.keys(product.stock).length).toBeGreaterThan(0);
      expect(Object.values(product.stock).some((count) => count > 0)).toBe(true);
    });
  });

  it("keeps a dependent product so the two-option path stays covered", () => {
    const dependent = FIXTURE_IDS.filter((id) => JSON.parse(Object.keys(loadFixture(id).product.stock)[0]).length > 1);
    expect(dependent).toContain(935);
  });
});
