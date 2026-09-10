import { beforeEach, describe, expect, it } from "vitest";
import { addCartButton, cardFor, checkoutParams, loadModules, mockFetch, quantity, resetDom, stepper, stubLocation } from "./helpers/harness.js";

let stepCart;
let data;
let location;

const click = (id) => document.querySelector(`#${id}`).click();

beforeEach(async () => {
  resetDom();
  mockFetch();
  location = stubLocation();
  ({ stepCart, data } = await loadModules());
  addCartButton("btn-a");
  addCartButton("btn-b");
});

describe("buttonOptions", () => {
  it("uses the per-button coupon and rebuilds from scratch on each click", async () => {
    await stepCart({
      products: [{ id: 1275 }, { id: 123 }],
      couponCode: "GLOBAL",
      buttonOptions: {
        "btn-a": { products: [{ id: 1275 }], couponCode: "COUPON_A" },
        "btn-b": { products: [{ id: 123 }], couponCode: "COUPON_B" },
      },
    });
    click("btn-a");
    expect(data.getCouponCode()).toBe("COUPON_A");
    expect(cardFor(1275)).toBeTruthy();
    expect(cardFor(123)).toBeFalsy();
    click("btn-b");
    expect(data.getCouponCode()).toBe("COUPON_B");
    expect(cardFor(1275)).toBeFalsy();
    expect(quantity()).toBe("1");
  });

  it("falls back to the global coupon when a button entry omits one", async () => {
    await stepCart({
      products: [{ id: 1275 }],
      couponCode: "GLOBAL",
      buttonOptions: { "btn-a": { products: [{ id: 1275 }] } },
    });
    click("btn-a");
    expect(data.getCouponCode()).toBe("GLOBAL");
    expect(checkoutParams(location).cc).toBe("GLOBAL");
  });

  it("drives per-quantity coupons off the button's own dynamicQtty config", async () => {
    await stepCart({
      products: [{ id: 1275 }],
      couponCode: "GLOBAL",
      buttonOptions: {
        "btn-a": { products: [{ id: 1275, dynamicQtty: { maxQtty: 3, couponCodes: { 3: "A3" } } }], couponCode: "COUPON_A" },
        "btn-b": { products: [{ id: 1275, dynamicQtty: { maxQtty: 3, couponCodes: { 3: "B3" } } }], couponCode: "COUPON_B" },
      },
    });
    click("btn-a");
    stepper(1275).type(3);
    expect(data.getCouponCode()).toBe("A3");
    click("btn-b");
    expect(data.getCouponCode()).toBe("COUPON_B");
    stepper(1275).type(3);
    expect(data.getCouponCode()).toBe("B3");
  });

  it("does not leak a quantity-swapped coupon into the next cart open", async () => {
    await stepCart({
      products: [{ id: 1275, dynamicQtty: { maxQtty: 3, couponCodes: { 2: "BUNDLE2" } } }],
      couponCode: "GLOBAL",
    });
    click("btn-a");
    stepper(1275).plus();
    expect(data.getCouponCode()).toBe("BUNDLE2");
    click("btn-a");
    expect(data.getCouponCode()).toBe("GLOBAL");
  });

  it("uses the per-button bump coupon, falling back to the global bump coupon", async () => {
    await stepCart({
      products: [{ id: 1275 }],
      couponCode: "GLOBAL",
      bump: { product: { id: 123, newPrice: { value: "$5.00" } }, couponCode: "BUMP_GLOBAL" },
      buttonOptions: {
        "btn-a": { products: [{ id: 1275 }], couponCode: "COUPON_A", bumpCoupon: "BUMP_A" },
        "btn-b": { products: [{ id: 1275 }], couponCode: "COUPON_B" },
      },
    });
    click("btn-a");
    expect(data.getBumpCoupon()).toBe("BUMP_A");
    click("btn-b");
    expect(data.getBumpCoupon()).toBe("BUMP_GLOBAL");
  });
});

describe("noCart", () => {
  it("checks out straight away on the base coupon, skipping the stepper", async () => {
    await stepCart({
      products: [{ id: 1275, quantity: 2, dynamicQtty: { maxQtty: 3, couponCodes: { 2: "BUNDLE2" } } }],
      couponCode: "GLOBAL",
      noCart: true,
    });
    click("btn-a");
    const url = new URL(location.href);
    expect(url.searchParams.get("cc")).toBe("GLOBAL");
    expect(url.href).toContain("products[0][id]=1275&products[0][quantity]=2");
    expect(document.querySelector(".cart__product__qtty-selector")).toBeFalsy();
  });

  it("honours a per-button noCart flag", async () => {
    await stepCart({
      products: [{ id: 1275 }],
      couponCode: "GLOBAL",
      buttonOptions: { "btn-a": { products: [{ id: 123, variant: 0 }], couponCode: "COUPON_A", noCart: true } },
    });
    click("btn-b");
    expect(document.querySelector(".cart-wrapper").classList.contains("active")).toBe(true);
  });
});
