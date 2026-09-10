import { beforeEach, describe, expect, it } from "vitest";
import { discount, loadModules, mountCart, quantity, resetDom, stubLocation, subtotal, total } from "./helpers/harness.js";

let data;

beforeEach(async () => {
  resetDom();
  stubLocation();
  ({ data } = await loadModules());
  await mountCart({ showFullPricing: true });
});

describe("coupon resolution", () => {
  it("sends the base code while no bump is added", () => {
    data.setCouponCode("BASE");
    data.setBumpCoupon("BUMP");
    expect(data.getCouponCode()).toBe("BASE");
    expect(data.getBaseCoupon()).toBe("BASE");
  });

  it("switches to the bump code and back", () => {
    data.setCouponCode("BASE");
    data.setBumpCoupon("BUMP");
    data.applyBumpCoupon();
    expect(data.getCouponCode()).toBe("BUMP");
    expect(data.isBumpCouponApplied()).toBe(true);
    data.revertBumpCoupon();
    expect(data.getCouponCode()).toBe("BASE");
    expect(data.isBumpCouponApplied()).toBe(false);
  });

  it("keeps the bump code live when the base code changes underneath it", () => {
    data.setCouponCode("BASE");
    data.setBumpCoupon("BUMP");
    data.applyBumpCoupon();
    data.setCouponCode("BASE_QTY3");
    expect(data.getCouponCode()).toBe("BUMP");
    data.revertBumpCoupon();
    expect(data.getCouponCode()).toBe("BASE_QTY3");
  });

  it("applies a new bump code immediately when one is already added", () => {
    data.setCouponCode("BASE");
    data.setBumpCoupon("BUMP1");
    data.applyBumpCoupon();
    data.setBumpCoupon("BUMP3");
    expect(data.getCouponCode()).toBe("BUMP3");
  });

  it("clears the applied flag on reset so the next cart opens on its base code", () => {
    data.setCouponCode("BASE");
    data.setBumpCoupon("BUMP");
    data.applyBumpCoupon();
    data.reset();
    data.setCouponCode("OTHER");
    expect(data.getCouponCode()).toBe("OTHER");
  });
});

describe("totals", () => {
  it("renders quantity, total, subtotal and derived discount", () => {
    data.setGlobalQuantity(3);
    data.setSubtotal(100);
    data.setTotalValue(75.5);
    expect(quantity()).toBe("3");
    expect(subtotal()).toBe("$100.00");
    expect(total()).toBe("$75.50");
    expect(discount()).toBe("-$24.50");
  });

  it("never renders a negative discount", () => {
    data.setSubtotal(10);
    data.setTotalValue(20);
    expect(discount()).toBe("-$0.00");
  });

  it("reset zeroes cart state but keeps apiProducts", () => {
    data.setApiProducts([{ id: 1, configs: { a: 1 } }]);
    data.setGlobalQuantity(5);
    data.setTotalValue(50);
    data.reset();
    expect(data.getGlobalQuantity()).toBe(0);
    expect(data.getTotalValue()).toBe(0);
    expect(data.getProducts()).toEqual([]);
    expect(data.getApiProducts()).toHaveLength(1);
    expect(data.getProductConfigs(1)).toEqual({ a: 1 });
  });
});

describe("product list", () => {
  it("adds, merges and replaces regular products by choice", () => {
    const product = { id: 7 };
    data.addRegularProduct({ product, choice: "1-2" });
    data.addRegularProduct({ product, choice: "1-2" });
    expect(data.getProducts()).toEqual([{ id: 7, choice: "1-2", quantity: 2, type: "regular" }]);
    data.addRegularProduct({ product, choice: "1-3" });
    expect(data.getProducts()).toHaveLength(2);
    data.addRegularProduct({ product, choice: "1-9", replace: true });
    expect(data.getProducts()).toEqual([{ id: 7, choice: "1-9", quantity: 1, type: "regular" }]);
  });

  it("sets quantity on an existing static entry and removes by product", () => {
    data.addStaticProduct({ product: { id: 3 }, quantity: 2 });
    data.setProductQuantity({ id: 3, quantity: 5 });
    expect(data.getProducts()[0].quantity).toBe(5);
    data.setProductQuantity({ id: 99, quantity: 5 });
    data.removeProduct({ product: { id: 3 } });
    expect(data.getProducts()).toEqual([]);
  });
});
