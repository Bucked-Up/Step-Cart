import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { $, addCartButton, checkout, flush, loadModules, mockFetch, resetDom, stubLocation } from "./helpers/harness.js";

let stepCart;
let location;
let release;

// Holds every fetch until release() so the test can act while start-up is in flight.
const holdFetch = (options) => {
  const fetchMock = mockFetch(options);
  const real = fetchMock.getMockImplementation();
  let open;
  const gate = new Promise((resolve) => (open = resolve));
  fetchMock.mockImplementation(async (url) => {
    await gate;
    return real(url);
  });
  release = async () => {
    open();
    for (let i = 0; i < 5; i++) await flush();
  };
};

const loading = () => document.body.classList.contains("loading");
const cartOpen = () => $(".cart-wrapper")?.classList.contains("active") ?? false;

beforeEach(async () => {
  resetDom();
  location = stubLocation();
  ({ stepCart } = await loadModules());
});

afterEach(() => vi.useRealTimers());

describe("showInitialLoading", () => {
  it("shows the loader during start-up by default", async () => {
    holdFetch();
    addCartButton("btn");
    const run = stepCart({ products: [{ id: 924 }] });
    expect(loading()).toBe(true);
    await release();
    await run;
    expect(loading()).toBe(false);
  });

  it("ignores a click before ready by default", async () => {
    holdFetch();
    const button = addCartButton("btn");
    const run = stepCart({ products: [{ id: 924 }] });
    button.click();
    expect(button.hasAttribute("aria-busy")).toBe(false);
    await release();
    await run;
    expect(cartOpen()).toBe(false);
  });

  it("skips the start-up loader when false", async () => {
    holdFetch();
    addCartButton("btn");
    const run = stepCart({ products: [{ id: 924 }], showInitialLoading: false });
    expect(loading()).toBe(false);
    await release();
    await run;
    expect(loading()).toBe(false);
    expect(cartOpen()).toBe(false);
  });

  it("queues an early click and opens the cart when ready", async () => {
    holdFetch();
    const button = addCartButton("btn");
    const run = stepCart({ products: [{ id: 924 }], showInitialLoading: false });
    button.click();
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(cartOpen()).toBe(false);
    await release();
    await run;
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(cartOpen()).toBe(true);
    expect($(`.cart__steps__step [prod-id="924"]`) || $(`[prod-id="924"]`)).toBeTruthy();
  });

  it("lets the last clicked button win and ignores repeats", async () => {
    holdFetch();
    const first = addCartButton("first");
    const second = addCartButton("second");
    const run = stepCart({
      products: [{ id: 924 }, { id: 935 }],
      buttonOptions: { first: { products: [{ id: 924 }] }, second: { products: [{ id: 935 }] } },
      showInitialLoading: false,
    });
    first.click();
    second.click();
    second.click();
    expect(first.hasAttribute("aria-busy")).toBe(false);
    expect(second.getAttribute("aria-busy")).toBe("true");
    await release();
    await run;
    expect(second.hasAttribute("aria-busy")).toBe(false);
    expect(cartOpen()).toBe(true);
    expect($(`[prod-id="935"]`)).toBeTruthy();
    expect($(`[prod-id="924"]`)).toBeFalsy();
  });

  it("opens the cart once for repeated early clicks", async () => {
    holdFetch();
    const button = addCartButton("btn");
    const run = stepCart({ products: [{ id: 935 }], showInitialLoading: false });
    button.click();
    button.click();
    await release();
    await run;
    expect(document.querySelectorAll(`[prod-id="935"]`).length).toBe(1);
  });

  it("works as before for a click after ready", async () => {
    mockFetch();
    const button = addCartButton("btn");
    await stepCart({ products: [{ id: 935 }], showInitialLoading: false });
    button.click();
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(cartOpen()).toBe(true);
  });

  it("clears aria-busy and runs the error flow when start-up fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    holdFetch({ outOfStock: [924] });
    const button = addCartButton("btn");
    const run = stepCart({ products: [{ id: 924 }], showInitialLoading: false });
    button.click();
    await release();
    await run;
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(document.body.classList.contains("error")).toBe(true);
    expect(cartOpen()).toBe(false);
  });

  it("keeps the checkout loader", async () => {
    mockFetch();
    const button = addCartButton("btn");
    await stepCart({ products: [{ id: 935 }], showInitialLoading: false });
    button.click();
    checkout(location);
    expect(loading()).toBe(true);
  });
});
