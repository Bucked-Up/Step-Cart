import { beforeEach, describe, expect, it } from "vitest";
import { $, $$, addCartButton, checkoutParams, loadModules, mockFetch, resetDom, stepper, stubLocation } from "./helpers/harness.js";

let stepCart;
let data;
let location;

const addInlineWrapper = () => {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("inline-products", "");
  document.body.appendChild(wrapper);
  return wrapper;
};

beforeEach(async () => {
  resetDom();
  mockFetch();
  location = stubLocation();
  ({ stepCart, data } = await loadModules());
});

describe("inline-products mode", () => {
  it("renders into the page wrapper instead of the cart steps", async () => {
    const wrapper = addInlineWrapper();
    addCartButton("btn");
    await stepCart({ products: [{ id: 201 }], couponCode: "BASE" });
    expect(wrapper.querySelector(".cart__steps__step")).toBeTruthy();
    expect($(".cart__steps__step__button")).toBeFalsy();
  });

  it("adds a placeholder for a pre-selected variant", async () => {
    const wrapper = addInlineWrapper();
    addCartButton("btn");
    await stepCart({ products: [{ id: 201, variant: 11951 }], couponCode: "BASE" });
    expect(wrapper.children.length).toBeGreaterThan(0);
  });

  it("blocks checkout while a dependent size is unpicked, then proceeds", async () => {
    addInlineWrapper();
    addCartButton("btn");
    await stepCart({ products: [{ id: 935 }], couponCode: "BASE" });
    document.querySelector("#btn").click();
    expect($(".cart-wrapper").classList.contains("active")).toBe(false);
    const sizeWrapper = $$(".cart__steps__step__selectors-wrapper")[1];
    expect(sizeWrapper.classList.contains("invalid")).toBe(true);

    const size = [...sizeWrapper.querySelectorAll("input")].find((input) => !input.disabled);
    size.checked = true;
    size.dispatchEvent(new window.Event("change"));
    document.querySelector("#btn").click();
    expect($(".cart-wrapper").classList.contains("active")).toBe(true);
  });

  it("still swaps per-quantity coupons from an inline stepper", async () => {
    addInlineWrapper();
    addCartButton("btn");
    await stepCart({
      products: [{ id: 1275, dynamicQtty: { maxQtty: 3, couponCodes: { 3: "BUNDLE3" } } }],
      couponCode: "BASE",
    });
    expect(data.getCouponCode()).toBe("BASE");
    stepper(1275).type(3);
    expect(data.getCouponCode()).toBe("BUNDLE3");
    expect(checkoutParams(location).cc).toBe("BUNDLE3");
  });
});
