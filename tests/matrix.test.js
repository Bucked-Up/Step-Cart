import { beforeEach, describe, expect, it } from "vitest";
import { addCartButton, addedList, bumpAdd, bumpStepAdd, cardFor, checkoutParams, loadModules, mockFetch, quantity, resetDom, stepper, stubLocation } from "./helpers/harness.js";

let stepCart;
let data;
let location;

const COUPON_CODES = { 2: "BUNDLE2", 3: "BUNDLE3" };
const BUMP_COUPON_CODES = { 2: "BUMP2", 3: "BUMP3" };
const GLOBAL_COUPON = "GLOBAL";
const GLOBAL_BUMP_COUPON = "GLOBAL_BUMP";
const BUTTON_COUPON = "BTN";
const BUTTON_BUMP_COUPON = "BTN_BUMP";

const bumpModes = ["none", "card", "step"];
const bumpOrders = ["before-qty", "after-qty"];
const quantities = [1, 2, 3];

// Every axis that can move the coupon, crossed. The expected code is recomputed from the
// same rules the README states rather than hard-coded per case.
const cases = [];
for (const bumpMode of bumpModes)
  for (const bumpOrder of bumpMode === "none" ? ["before-qty"] : bumpOrders)
    for (const withCouponCodes of [true, false])
      for (const withBumpCouponCodes of [true, false])
        for (const qty of quantities)
          for (const perButton of [false, true])
            cases.push({ bumpMode, bumpOrder, withCouponCodes, withBumpCouponCodes, qty, perButton });

const buildConfig = ({ bumpMode, withCouponCodes, withBumpCouponCodes, perButton }) => {
  const dynamicQtty = { maxQtty: 3, qttyTexts: { 1: "one", 2: "two", 3: "three" } };
  if (withCouponCodes) dynamicQtty.couponCodes = COUPON_CODES;
  if (withBumpCouponCodes) dynamicQtty.bumpCouponCodes = BUMP_COUPON_CODES;
  const products = [
    { id: 1275, dynamicQtty, attachQtty: [123] },
    { id: 123, newPrice: { value: "FREE" } },
    { id: 201, variant: 11951, newPrice: { value: "FREE" }, isBonus: { parentProd: 1275, parentQtty: 2 } },
  ];
  const config = { products, couponCode: GLOBAL_COUPON, showFullPricing: true, showBonus: true };
  if (bumpMode !== "none") {
    config.bump = {
      product: { id: 924, variant: 14003, newPrice: { value: "$5.00" } },
      couponCode: GLOBAL_BUMP_COUPON,
      isStep: bumpMode === "step",
    };
  }
  if (perButton) {
    config.buttonOptions = { btn: { products, couponCode: BUTTON_COUPON, bumpCoupon: BUTTON_BUMP_COUPON } };
  }
  return config;
};

const expectedCoupon = ({ bumpMode, withCouponCodes, withBumpCouponCodes, qty, perButton }) => {
  const base = perButton ? BUTTON_COUPON : GLOBAL_COUPON;
  const baseBump = perButton ? BUTTON_BUMP_COUPON : GLOBAL_BUMP_COUPON;
  if (bumpMode === "none") return withCouponCodes ? (COUPON_CODES[qty] ?? base) : base;
  return withBumpCouponCodes ? (BUMP_COUPON_CODES[qty] ?? baseBump) : baseBump;
};

const addBump = (bumpMode) => {
  if (bumpMode === "card") bumpAdd().click();
  if (bumpMode === "step") bumpStepAdd().click();
};

const label = (testCase) =>
  [
    `bump=${testCase.bumpMode}`,
    testCase.bumpMode === "none" ? null : `added ${testCase.bumpOrder}`,
    `qty=${testCase.qty}`,
    testCase.withCouponCodes ? "couponCodes" : "no couponCodes",
    testCase.withBumpCouponCodes ? "bumpCouponCodes" : "no bumpCouponCodes",
    testCase.perButton ? "buttonOptions" : "global",
  ]
    .filter(Boolean)
    .join(" · ");

beforeEach(async () => {
  resetDom();
  mockFetch();
  location = stubLocation();
  ({ stepCart, data } = await loadModules());
});

describe("coupon across every configuration", () => {
  cases.forEach((testCase) => {
    it(label(testCase), async () => {
      addCartButton("btn");
      await stepCart(buildConfig(testCase));
      document.querySelector("#btn").click();

      if (testCase.bumpOrder === "before-qty") addBump(testCase.bumpMode);
      if (testCase.qty !== 1) stepper(1275).type(testCase.qty);
      if (testCase.bumpOrder === "after-qty") addBump(testCase.bumpMode);

      const expected = expectedCoupon(testCase);
      expect(data.getCouponCode()).toBe(expected);

      const { url, cc } = checkoutParams(location);
      expect(cc).toBe(expected);
      // The stepper parent and its attachQtty follower always ship the chosen quantity.
      expect(url.href).toContain(`products[0][id]=1275&products[0][quantity]=${testCase.qty}`);
      expect(url.href).toContain(`products[1][id]=123&products[1][quantity]=${testCase.qty}`);
      // The bonus at threshold 2 ships only once the stepper reaches it.
      expect(url.href.includes("[id]=201")).toBe(testCase.qty >= 2);
      // The bump ships only once it has been added.
      expect(url.href.includes("[id]=924")).toBe(testCase.bumpMode !== "none");
    });
  });
});

const PERK = "Free Shipping";
const PERK_QTY = 2;

describe("quantity, totals and bonuses across configurations", () => {
  for (const showBonus of [true, false])
    for (const withAttach of [true, false])
      for (const withPerks of [true, false])
        for (const qty of quantities) {
        it(`showBonus=${showBonus} · attachQtty=${withAttach} · addedTexts=${withPerks} · qty=${qty}`, async () => {
          const parent = { id: 1275, dynamicQtty: { maxQtty: 3, qttyTexts: { 1: "one", 2: "two", 3: "three" } } };
          if (withPerks) parent.dynamicQtty.addedTexts = { [PERK_QTY]: PERK };
          if (withAttach) parent.attachQtty = [123];
          addCartButton("btn");
          await stepCart({
            products: [
              parent,
              { id: 123, newPrice: { value: "FREE" } },
              { id: 201, variant: 11951, newPrice: { value: "FREE" }, isBonus: { parentProd: 1275, parentQtty: 3 } },
            ],
            couponCode: GLOBAL_COUPON,
            showFullPricing: true,
            showBonus,
          });
          document.querySelector("#btn").click();
          if (qty !== 1) stepper(1275).type(qty);

          const bonusUnlocked = qty >= 3;
          const followerQty = withAttach ? qty : 1;
          expect(Number(quantity())).toBe(qty + followerQty + (bonusUnlocked ? 1 : 0));
          // 1275 is the only line with a price; the rest are FREE.
          expect(checkoutParams(location).url.href).toContain(`products[0][id]=1275&products[0][quantity]=${qty}`);
          expect(checkoutParams(location).url.href).toContain(`products[1][id]=123&products[1][quantity]=${followerQty}`);

          const bonusCard = cardFor(201);
          if (showBonus) expect(bonusCard.classList.contains("cart__product--locked")).toBe(!bonusUnlocked);
          else expect(bonusCard.style.display).toBe(bonusUnlocked ? "" : "none");

          // The bonus at threshold 3 always lists last; the perk joins it from qty 2 up.
          const expectedAdded = [];
          if (withPerks && qty >= PERK_QTY) expectedAdded.push(`<b>${PERK}</b> added`);
          if (bonusUnlocked) expectedAdded.push("<b>Creatine Monohydrate</b> added");
          expect(addedList()).toEqual(expectedAdded);
        });
        }
});

// A configured `quantity` must reach checkout whatever renders the product. newPrice is the
// line total; a variant surcharge scales per unit on a step (static cards show list price only).
// A step renders one selection per unit: "all" picks the surcharged flavor on every unit,
// "first" picks it on unit 1 only, which splits the checkout into two lines.
const BASE_201 = 27.99;
const SURCHARGE_11952 = 2;
describe("configured quantity across product kinds", () => {
  for (const kind of ["preset", "step"])
    for (const withNewPrice of [false, true])
      for (const surcharged of kind === "step" ? [false, "all", "first"] : [false])
        for (const qty of quantities)
          it(`kind=${kind} · newPrice=${withNewPrice} · surcharge=${surcharged} · qty=${qty}`, async () => {
            const product = { id: 201, quantity: qty };
            if (kind === "preset") product.variant = 11951;
            else product.selector = "text";
            if (withNewPrice) product.newPrice = { value: "$33.76" };
            addCartButton("btn");
            await stepCart({ products: [product] });
            document.querySelector("#btn").click();
            const unitSteps = [...document.querySelectorAll(".cart__steps__step")];
            expect(unitSteps).toHaveLength(kind === "step" ? qty : 0);
            const pickedUnits = surcharged === "all" ? qty : surcharged === "first" ? 1 : 0;
            unitSteps.slice(0, pickedUnits).forEach((step) => {
              const input = [...step.querySelectorAll('input[type="radio"]')].find((el) => el.value === "11952");
              input.checked = true;
              input.dispatchEvent(new window.Event("change"));
            });

            const surcharge = SURCHARGE_11952 * pickedUnits;
            const expectedTotal = withNewPrice ? 33.76 + surcharge : BASE_201 * qty + surcharge;
            expect(data.getTotalValue()).toBeCloseTo(expectedTotal, 2);
            expect(Number(quantity())).toBe(qty);
            const badge = cardFor(201).querySelector(".cart__product__quantity");
            expect(badge.style.display).toBe(qty > 1 ? "" : "none");
            const href = checkoutParams(location).url.href;
            if (pickedUnits === 0 || pickedUnits === qty) {
              const choice = pickedUnits ? 11952 : 11951;
              expect(href).toContain(`products[0][id]=201&products[0][quantity]=${qty}&products[0][options][2926]=${choice}`);
              expect(href).not.toContain("products[1]");
            } else {
              // Unit 1 moved to its own line; the untouched units stay merged.
              expect(href).toContain(`products[0][id]=201&products[0][quantity]=${qty - 1}&products[0][options][2926]=11951`);
              expect(href).toContain(`products[1][id]=201&products[1][quantity]=1&products[1][options][2926]=11952`);
            }
          });

  it("ships the configured quantity for an isBonus variant card once unlocked", async () => {
    addCartButton("btn");
    await stepCart({
      products: [
        { id: 1275, dynamicQtty: { maxQtty: 3 } },
        { id: 201, quantity: 2, newPrice: { value: "FREE" }, isBonus: { parentProd: 1275, parentQtty: 2 } },
      ],
    });
    document.querySelector("#btn").click();
    expect(checkoutParams(location).url.href.includes("[id]=201")).toBe(false);
    stepper(1275).type(2);
    expect(checkoutParams(location).url.href).toMatch(/products\[1\]\[id\]=201&products\[1\]\[quantity\]=2/);
  });
});
