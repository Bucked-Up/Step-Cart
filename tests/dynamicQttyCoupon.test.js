import { beforeEach, describe, expect, it } from "vitest";
import { addCartButton, bumpAdd, bumpRemove, checkoutParams, loadModules, mockFetch, resetDom, stepper, stubLocation } from "./helpers/harness.js";

let stepCart;
let data;
let location;

// 1275 is the stepper parent, 123 rides along via attachQtty.
const dynamicProduct = (dynamicQtty) => ({ id: 1275, dynamicQtty, attachQtty: [123] });

const open = async (config, buttonId = "btn") => {
  addCartButton(buttonId);
  await stepCart(config);
  document.querySelector(`#${buttonId}`).click();
};

beforeEach(async () => {
  resetDom();
  mockFetch();
  location = stubLocation();
  ({ stepCart, data } = await loadModules());
});

describe("dynamicQtty couponCodes", () => {
  const couponCodes = { 2: "BUNDLE2", 3: "BUNDLE3" };

  it("falls back to the configured coupon for quantities absent from the map", async () => {
    await open({ products: [dynamicProduct({ maxQtty: 3, couponCodes }), { id: 123 }], couponCode: "BASE" });
    expect(data.getCouponCode()).toBe("BASE");
  });

  it("swaps the coupon as the stepper walks up and back down", async () => {
    await open({ products: [dynamicProduct({ maxQtty: 3, couponCodes }), { id: 123 }], couponCode: "BASE" });
    const qty = stepper(1275);
    qty.plus();
    expect(data.getCouponCode()).toBe("BUNDLE2");
    qty.plus();
    expect(data.getCouponCode()).toBe("BUNDLE3");
    qty.minus();
    expect(data.getCouponCode()).toBe("BUNDLE2");
    qty.minus();
    expect(data.getCouponCode()).toBe("BASE");
  });

  it("swaps on a typed quantity, using the clamped value", async () => {
    await open({ products: [dynamicProduct({ maxQtty: 3, couponCodes }), { id: 123 }], couponCode: "BASE" });
    stepper(1275).type(2);
    expect(data.getCouponCode()).toBe("BUNDLE2");
    stepper(1275).type(99);
    expect(data.getCouponCode()).toBe("BUNDLE3");
  });

  it("resolves the starting quantity at render, before any interaction", async () => {
    await open({ products: [{ id: 1275, quantity: 3, dynamicQtty: { maxQtty: 3, couponCodes } }], couponCode: "BASE" });
    expect(data.getCouponCode()).toBe("BUNDLE3");
  });

  it("ships the swapped coupon as cc at checkout", async () => {
    await open({ products: [dynamicProduct({ maxQtty: 3, couponCodes }), { id: 123 }], couponCode: "BASE" });
    stepper(1275).plus();
    expect(checkoutParams(location).cc).toBe("BUNDLE2");
  });

  it("leaves the coupon alone when no map is configured", async () => {
    await open({ products: [dynamicProduct({ maxQtty: 3 }), { id: 123 }], couponCode: "BASE" });
    stepper(1275).plus();
    expect(data.getCouponCode()).toBe("BASE");
  });

  it("treats an undefined configured coupon as the fallback", async () => {
    await open({ products: [dynamicProduct({ maxQtty: 3, couponCodes })] });
    expect(data.getCouponCode()).toBeUndefined();
    stepper(1275).plus();
    expect(data.getCouponCode()).toBe("BUNDLE2");
    stepper(1275).minus();
    expect(data.getCouponCode()).toBeUndefined();
  });
});

describe("dynamicQtty bumpCouponCodes", () => {
  const config = (extra = {}) => ({
    products: [dynamicProduct({ maxQtty: 3, couponCodes: { 2: "BUNDLE2", 3: "BUNDLE3" }, bumpCouponCodes: { 2: "BUMP2", 3: "BUMP3" } }), { id: 123 }],
    couponCode: "BASE",
    bump: { product: { id: 924, variant: 14003, newPrice: { value: "$5.00" } }, couponCode: "BUMPBASE" },
    ...extra,
  });

  it("keeps the bump code live and follows the stepper while a bump is added", async () => {
    await open(config());
    bumpAdd().click();
    expect(data.getCouponCode()).toBe("BUMPBASE");
    stepper(1275).plus();
    expect(data.getCouponCode()).toBe("BUMP2");
    stepper(1275).plus();
    expect(data.getCouponCode()).toBe("BUMP3");
  });

  it("restores the quantity's base code, not the one captured when the bump rendered", async () => {
    await open(config());
    bumpAdd().click();
    stepper(1275).plus();
    stepper(1275).plus();
    bumpRemove().click();
    expect(data.getCouponCode()).toBe("BUNDLE3");
  });

  it("applies the quantity's bump code when the bump is added after the change", async () => {
    await open(config());
    stepper(1275).plus();
    expect(data.getCouponCode()).toBe("BUNDLE2");
    bumpAdd().click();
    expect(data.getCouponCode()).toBe("BUMP2");
  });

  it("falls back to bump.couponCode for unlisted quantities", async () => {
    await open(config());
    bumpAdd().click();
    stepper(1275).plus();
    stepper(1275).minus();
    expect(data.getCouponCode()).toBe("BUMPBASE");
  });

  it("ships the bump code as cc at checkout", async () => {
    await open(config());
    bumpAdd().click();
    stepper(1275).plus();
    expect(checkoutParams(location).cc).toBe("BUMP2");
  });
});
