import { beforeEach, describe, expect, it } from "vitest";
import { loadModules, mountCart, resetDom, stubLocation } from "./helpers/harness.js";

let data;
let handlePurchase;
let location;

const go = (options = {}) => {
  handlePurchase({ urlParams: new URLSearchParams(), ...options });
  return new URL(location.href);
};

beforeEach(async () => {
  resetDom();
  location = stubLocation("https://offer.example.com/landing?utm=x");
  ({ data } = await loadModules());
  await mountCart();
  ({ default: handlePurchase } = await import("../src/js/modules/handlePurchase.js"));
});

describe("handlePurchase", () => {
  it("serialises static and variant lines with indexed keys", () => {
    data.addStaticProduct({ product: { id: 1275 }, quantity: 2 });
    data.addRegularProduct({ product: { id: 201 }, choice: "2926-11951" });
    const url = go();
    expect(url.href).toContain("products[0][id]=1275&products[0][quantity]=2");
    expect(url.href).toContain("products[1][id]=201&products[1][quantity]=1");
    expect(url.href).toContain("products[1][options][2926]=11951");
    expect(url.href).toContain("&clear=true");
  });

  it("splits a dependent choice into one options key per option id", () => {
    data.addRegularProduct({ product: { id: 935 }, choice: "1754-8032/1755-8037" });
    const url = go();
    expect(url.href).toContain("products[0][options][1754]=8032");
    expect(url.href).toContain("products[0][options][1755]=8037");
  });

  it("carries the live coupon, honouring an applied bump", () => {
    data.setCouponCode("BASE");
    data.setBumpCoupon("BUMP");
    expect(go().searchParams.get("cc")).toBe("BASE");
    data.applyBumpCoupon();
    expect(go().searchParams.get("cc")).toBe("BUMP");
  });

  it("strips the query off source_url", () => {
    expect(go().searchParams.get("source_url")).toBe("https://offer.example.com/landing");
  });

  it("adds rl_anonymous_id only when the cookie is present", () => {
    expect(go().searchParams.has("rl_anonymous_id")).toBe(false);
    document.cookie = "rl_anonymous_id=anon-123";
    expect(go().searchParams.get("rl_anonymous_id")).toBe("anon-123");
    document.cookie = "rl_anonymous_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it("picks the checkout domain from country", () => {
    data.addStaticProduct({ product: { id: 1 } });
    expect(go().origin).toBe("https://funnels.buckedup.com");
    expect(go({ country: "us-main" }).origin).toBe("https://buckedup.com");
    expect(go({ country: "uk" }).origin).toBe("https://www.buckedup.co.uk");
    expect(go({ country: "us" }).origin).toBe("https://funnels.buckedup.com");
  });

  it("preserves incoming url params", () => {
    handlePurchase({ urlParams: new URLSearchParams("aff=partner") });
    expect(new URL(location.href).searchParams.get("aff")).toBe("partner");
  });

  it("splits a recurring line into its recurring unit and the remainder", async () => {
    const select = document.createElement("input");
    select.type = "radio";
    select.name = "1275-recurring";
    select.value = "88";
    select.checked = true;
    document.body.appendChild(select);
    data.setApiProducts([{ id: 1275, configs: { recurring: true } }]);
    data.addStaticProduct({ product: { id: 1275 }, quantity: 3 });
    const url = go();
    expect(url.href).toContain("products[0][id]=1275&products[0][quantity]=1&products[0][product_recurring_id]=88");
    expect(url.href).toContain("products[1][id]=1275&products[1][quantity]=2");
  });
});
