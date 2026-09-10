import { beforeEach, describe, expect, it } from "vitest";
import { $, addCartButton, bumpAdd, bumpRemove, bumpStepAdd, bumpStepSkip, cardFor, checkoutParams, loadModules, mockFetch, priceOf, quantity, resetDom, steps, stepsText, stubLocation, total } from "./helpers/harness.js";

let stepCart;
let data;
let location;

const open = async (config) => {
  addCartButton("btn");
  await stepCart(config);
  document.querySelector("#btn").click();
};

const withChangePrices = (extra = {}) => ({
  products: [{ id: 1275 }, { id: 201, variant: 11951 }],
  couponCode: "BASE",
  bump: {
    product: { id: 123, newPrice: { value: "$10.00" }, changePrices: [{ id: 1275, newPrice: "FREE" }] },
    couponCode: "BUMPCODE",
    ...extra,
  },
});

beforeEach(async () => {
  resetDom();
  mockFetch();
  location = stubLocation();
  ({ stepCart, data } = await loadModules());
});

describe("card bump", () => {
  it("adds and removes the bump, moving the card between wrappers", async () => {
    await open(withChangePrices());
    expect(cardFor(123).closest("[cart-bumps]")).toBeTruthy();
    bumpAdd().click();
    expect(cardFor(123).closest("[cart-products]")).toBeTruthy();
    bumpRemove().click();
    expect(cardFor(123).closest("[cart-bumps]")).toBeTruthy();
  });

  it("swaps the coupon on add and restores it on remove", async () => {
    await open(withChangePrices());
    expect(data.getCouponCode()).toBe("BASE");
    bumpAdd().click();
    expect(data.getCouponCode()).toBe("BUMPCODE");
    expect(checkoutParams(location).cc).toBe("BUMPCODE");
    bumpRemove().click();
    expect(data.getCouponCode()).toBe("BASE");
  });

  it("rewrites other products' displayed prices and reverses them on remove", async () => {
    await open(withChangePrices());
    expect(priceOf(1275)).toBe("$59.99");
    const before = total();
    bumpAdd().click();
    expect(priceOf(1275)).toBe("FREE");
    expect(total()).toBe("$37.99");
    bumpRemove().click();
    expect(priceOf(1275)).toBe("$59.99");
    expect(total()).toBe(before);
  });

  it("tracks quantity through add and remove", async () => {
    await open(withChangePrices());
    const before = quantity();
    bumpAdd().click();
    expect(Number(quantity())).toBe(Number(before) + 1);
    bumpRemove().click();
    expect(quantity()).toBe(before);
  });

  it("puts the bump on the checkout url only while it is added", async () => {
    await open(withChangePrices());
    expect(checkoutParams(location).url.href).not.toContain("[id]=123");
    bumpAdd().click();
    expect(checkoutParams(location).url.href).toContain("[id]=123");
    bumpRemove().click();
    expect(checkoutParams(location).url.href).not.toContain("[id]=123");
  });

  it("uses the configured bump title", async () => {
    await open({ ...withChangePrices(), bump: { ...withChangePrices().bump, title: "Want an upgrade?" } });
    expect($(".cart__bumps__title").innerHTML).toBe("Want an upgrade?");
  });
});

describe("step bump", () => {
  // 201 without a variant renders as a wizard step, so the bump step lands after it.
  const stepConfig = () => ({ ...withChangePrices({ isStep: true, title: "Upgrade time" }), products: [{ id: 1275 }, { id: 201 }] });

  it("appends a bump step after the variant steps, with its own headline", async () => {
    await open(stepConfig());
    expect(steps()).toHaveLength(2);
    expect(steps()[1].querySelector(".cart__steps__step__headline")).toBeTruthy();
    expect(stepsText()).toBe("Step 1 of 2");
    expect($(".cart__steps__step__headline").innerHTML).toBe("Upgrade time");
  });

  it("applies the bump coupon on ADD and advances", async () => {
    await open(stepConfig());
    bumpStepAdd().click();
    expect(data.getCouponCode()).toBe("BUMPCODE");
    expect(checkoutParams(location).url.href).toContain("[id]=123");
  });

  it("reverts the coupon, prices and totals on SKIP", async () => {
    await open(stepConfig());
    const before = total();
    bumpStepAdd().click();
    expect(priceOf(1275)).toBe("FREE");
    bumpStepSkip().click();
    expect(data.getCouponCode()).toBe("BASE");
    expect(priceOf(1275)).toBe("$59.99");
    expect(total()).toBe(before);
    expect(checkoutParams(location).url.href).not.toContain("[id]=123");
  });

  it("is idempotent when ADD or SKIP is clicked twice", async () => {
    await open(stepConfig());
    const before = total();
    bumpStepAdd().click();
    const added = total();
    bumpStepAdd().click();
    expect(total()).toBe(added);
    bumpStepSkip().click();
    bumpStepSkip().click();
    expect(total()).toBe(before);
    expect(data.getCouponCode()).toBe("BASE");
  });

  it("does not render a card bump when isStep is set", async () => {
    await open(stepConfig());
    expect($(".cart__product__bump-button")).toBeFalsy();
  });
});
