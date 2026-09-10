import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadModules, resetDom } from "./helpers/harness.js";

let createQuantitySelector;

const mount = (options) => {
  const selector = createQuantitySelector(options);
  document.body.appendChild(selector.element);
  const [minus, plus] = [...selector.element.querySelectorAll("button")];
  const input = selector.element.querySelector("input");
  return { ...selector, minus, plus, input };
};

beforeEach(async () => {
  resetDom();
  await loadModules();
  ({ default: createQuantitySelector } = await import("../src/js/modules/createProducts/createQuantitySelector.js"));
});

describe("createQuantitySelector", () => {
  it("starts disabled at the lower bound and enables after a step up", () => {
    const { minus, plus } = mount({ initialQty: 1, maxQtty: 3 });
    expect(minus.disabled).toBe(true);
    expect(plus.disabled).toBe(false);
    plus.click();
    expect(minus.disabled).toBe(false);
  });

  it("disables the plus button at maxQtty and fires no further change", () => {
    const onChange = vi.fn();
    const { plus } = mount({ initialQty: 2, maxQtty: 3, onChange });
    plus.click();
    expect(plus.disabled).toBe(true);
    plus.click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(3, 2);
  });

  it("clamps a typed value above maxQtty and reports the clamped quantity", () => {
    const onChange = vi.fn();
    const { input } = mount({ initialQty: 1, maxQtty: 3, onChange });
    input.value = "99";
    input.dispatchEvent(new window.Event("change"));
    expect(input.value).toBe("3");
    expect(onChange).toHaveBeenCalledWith(3, 1);
  });

  it("clamps typed zero, negatives and junk up to 1 without firing when unchanged", () => {
    const onChange = vi.fn();
    const { input } = mount({ initialQty: 1, maxQtty: 3, onChange });
    ["0", "-4", "abc", ""].forEach((value) => {
      input.value = value;
      input.dispatchEvent(new window.Event("change"));
      expect(input.value).toBe("1");
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("floors fractional input", () => {
    const onChange = vi.fn();
    const { input } = mount({ initialQty: 1, maxQtty: 5, onChange });
    input.value = "2.9";
    input.dispatchEvent(new window.Event("change"));
    expect(onChange).toHaveBeenCalledWith(2, 1);
  });

  it("exposes setQty for programmatic changes", () => {
    const onChange = vi.fn();
    const { setQty, input } = mount({ initialQty: 1, maxQtty: 4, onChange });
    setQty(3);
    expect(input.value).toBe("3");
    expect(onChange).toHaveBeenCalledWith(3, 1);
  });

  it("defaults to a fixed single-quantity stepper when no bounds are given", () => {
    const { minus, plus, input } = mount({});
    expect(input.value).toBe("1");
    expect(minus.disabled).toBe(true);
    expect(plus.disabled).toBe(true);
  });
});
