import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";

// vitest rewrites import.meta.url under jsdom, so anchor on the repo root instead.
const fixturePath = (id) => path.resolve(process.cwd(), "tests/fixtures", `product-${id}.json`);

// Responses captured from funnels.buckedup.com so tests run against the real payload
// shape — option ids, "$0.00" price strings, and stock keys that encode one option
// (`[11951]`) or two for dependent products (`[8032,8037]`).
export const loadFixture = (id) => JSON.parse(fs.readFileSync(fixturePath(id), "utf8"));

export const FIXTURE_IDS = [123, 201, 924, 935, 1275];

export const mockFetch = ({ notFound = [], serverError = [], outOfStock = [] } = {}) => {
  const calls = [];
  const fetchMock = vi.fn(async (url) => {
    const id = Number(new URL(url).searchParams.get("product_id"));
    calls.push({ id, url });
    if (notFound.includes(id)) return { status: 404, json: async () => ({}) };
    if (serverError.includes(id)) return { status: 500, json: async () => ({}) };
    const data = loadFixture(id);
    if (outOfStock.includes(id)) Object.keys(data.product.stock).forEach((key) => (data.product.stock[key] = 0));
    return { status: 200, json: async () => data };
  });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.calls = calls;
  return fetchMock;
};

// jsdom refuses real navigation, so swap location for a plain object the assertions read.
export const stubLocation = (href = "https://offer.example.com/landing") => {
  const location = { href, search: "", hash: "", assign() {}, replace() {}, toString: () => location.href };
  Object.defineProperty(window, "location", { value: location, writable: true, configurable: true });
  return location;
};

export const resetDom = () => {
  document.body.innerHTML = "";
  document.body.className = "";
  document.body.removeAttribute("style");
  window.dataLayer = [];
};

export const addCartButton = (id = "btn") => {
  const button = document.createElement("button");
  button.id = id;
  button.setAttribute("cart-button", "");
  document.body.appendChild(button);
  return button;
};

// Every module keeps state in module-scoped `let`s, so each test needs a fresh registry.
// stepCart and data must come from the same one for the assertions to see live state.
export const loadModules = async () => {
  vi.resetModules();
  const data = await import("../../src/js/modules/data.js");
  const { default: stepCart } = await import("../../src/js/stepCart.js");
  return { stepCart, data };
};

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];

export const cardFor = (id) => $(`.cart__product[prod-id="${id}"]`) || $(`.cart__product__new-price[prod-id="${id}"]`)?.closest(".cart__product");

export const stepper = (id) => {
  const card = cardFor(id);
  if (!card) return null;
  const el = card.querySelector(".cart__product__qtty-selector");
  if (!el) return null;
  const [minus, plus] = [...el.querySelectorAll("button")];
  return {
    input: el.querySelector("input"),
    plus: () => plus.click(),
    minus: () => minus.click(),
    type: (value) => {
      const input = el.querySelector("input");
      input.value = String(value);
      input.dispatchEvent(new window.Event("change"));
    },
  };
};

export const total = () => $("[cart-total]").innerHTML;
export const subtotal = () => $("[cart-subtotal]").innerHTML;
export const discount = () => $("[cart-discount]").innerHTML;
export const quantity = () => $("[cart-qtty]").innerHTML;
export const progressText = () => $("[cart-progress-text]").innerHTML;

export const checkout = (location) => {
  $("[purchase-button]").click();
  return new URL(location.href);
};

export const checkoutParams = (location) => {
  const url = checkout(location);
  // Repeated products[i][...] keys — URLSearchParams keeps them all, so read as a list.
  return { url, params: url.searchParams, cc: url.searchParams.get("cc") };
};

// data.js writes straight into [cart-qtty] / [cart-total], so unit tests that touch
// quantity or totals must have the real cart markup in the document first.
export const mountCart = async (options = {}) => {
  const { default: createCart } = await import("../../src/js/modules/createCart.js");
  return createCart({ urlParams: new URLSearchParams(), ...options });
};

export const bumpAdd = () => $$(".cart__product__bump-button").find((el) => !el.classList.contains("remove-button"));
export const bumpRemove = () => $(".cart__product__bump-button.remove-button");

export const steps = () => $$(".cart__steps__step");
export const activeStep = () => $(".cart__steps__step.active");
export const stepsText = () => $("[steps-text]").innerHTML;
export const nextStep = () => activeStep().querySelector(".cart__steps__step__button").click();
export const stepBack = () => $("[step-back]").click();
export const stepsVisible = () => $("[cart-steps]").classList.contains("active");

export const bumpStepAdd = () => $$(".cart__steps__step__button").find((el) => el.innerHTML === "ADD TO CART");
export const bumpStepSkip = () => $(".cart__steps__step__button--skip");
export const priceOf = (id) => $(`.cart__product__new-price[prod-id="${id}"]`).innerHTML;

// The "added" list under the progress bar, one entry per unlocked bonus or perk.
export const addedList = () => [...$$("[cart-progress-added] p")].map((el) => el.innerHTML);
export const progressMet = () => $("[cart-progress]").classList.contains("cart__progress--met");
