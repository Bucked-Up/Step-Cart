import { beforeEach, describe, expect, it } from "vitest";
import { $, $$, addCartButton, addedList, cardFor, checkoutParams, loadModules, mockFetch, nextStep, progressMet, progressText, quantity, resetDom, stepBack, stepper, steps, stepsText, stepsVisible, stubLocation, subtotal, total } from "./helpers/harness.js";

let stepCart;
let data;
let location;

const open = async (config) => {
  addCartButton("btn");
  await stepCart(config);
  document.querySelector("#btn").click();
};

const selectorInputs = (index = 0) => [...steps()[index].querySelectorAll('input[type="radio"]')];

beforeEach(async () => {
  resetDom();
  mockFetch();
  location = stubLocation();
  ({ stepCart, data } = await loadModules());
});

describe("static products", () => {
  it("prices a plain product at list price and a FREE one at zero", async () => {
    await open({ products: [{ id: 1275 }, { id: 123, newPrice: { value: "FREE" } }], showFullPricing: true });
    expect(total()).toBe("$59.99");
    expect(subtotal()).toBe("$129.98");
    expect($('.cart__product__new-price[prod-id="123"]').innerHTML).toBe("FREE");
  });

  it("multiplies a configured quantity into the total", async () => {
    await open({ products: [{ id: 1275, quantity: 3 }] });
    expect(quantity()).toBe("3");
    expect(total()).toBe("$179.97");
  });

  it("splits a card in two when newPrice.affect is set", async () => {
    await open({ products: [{ id: 1275, quantity: 3, newPrice: { value: "$10.00", affect: 1 } }] });
    expect($$('.cart__product__new-price[prod-id="1275"]')).toHaveLength(2);
  });

  it("renders a pre-selected variant as a static card and sends its choice", async () => {
    await open({ products: [{ id: 201, variant: 11951 }] });
    expect($(".cart__steps__step")).toBeFalsy();
    expect(checkoutParams(location).url.href).toContain("products[0][options][2926]=11951");
  });

  it("ships the configured quantity for a pre-selected variant", async () => {
    await open({ products: [{ id: 201, variant: 11951, quantity: 2, newPrice: { value: "$33.76" } }] });
    expect(cardFor(201).querySelector(".cart__product__quantity").innerHTML).toBe("2");
    expect(total()).toBe("$33.76");
    expect(checkoutParams(location).url.href).toContain("products[0][id]=201&products[0][quantity]=2&products[0][options][2926]=11951");
  });
});

describe("variant steps", () => {
  it("builds one step per variant product and advances through them", async () => {
    await open({ products: [{ id: 201 }, { id: 924 }] });
    expect(steps()).toHaveLength(2);
    expect(stepsText()).toBe("Step 1 of 2");
    nextStep();
    expect(stepsText()).toBe("Step 2 of 2");
    stepBack();
    expect(stepsText()).toBe("Step 1 of 2");
    nextStep();
    nextStep();
    expect(stepsVisible()).toBe(false);
  });

  it("preselects the first in-stock value and swaps the choice on change", async () => {
    await open({ products: [{ id: 201, selector: "text" }] });
    const inputs = selectorInputs();
    expect(inputs.find((input) => input.checked).value).toBe("11951");
    const next = inputs.find((input) => !input.checked && !input.disabled);
    next.checked = true;
    next.dispatchEvent(new window.Event("change"));
    nextStep();
    expect(checkoutParams(location).url.href).toContain(`products[0][options][2926]=${next.value}`);
  });

  // The btn-3 tier of promo.buckedup.com/freecreatinesamples: two tubs, one flavor each.
  it("renders one step per unit so each unit picks its own flavor", async () => {
    await open({ products: [{ id: 201, selector: "text", quantity: 2, newPrice: { value: "$33.76" } }] });
    const card = cardFor(201);
    const badge = card.querySelector(".cart__product__quantity");
    expect(badge.innerHTML).toBe("2");
    expect(badge.style.display).toBe("");
    expect(steps()).toHaveLength(2);
    expect(stepsText()).toBe("Step 1 of 2");
    expect(steps().map((step) => step.querySelector(".cart__steps__step__title").innerHTML)).toEqual(["Choose your Creatine Monohydrate:", "Choose your Creatine Monohydrate:"]);
    // The unit counter is its own line right under the title row.
    expect(steps().map((step) => step.querySelector(".cart__steps__step__title-price-wrapper").nextElementSibling.innerHTML)).toEqual(["Step 1 of 2", "Step 2 of 2"]);
    expect(card.querySelector(".cart__product__old-price").innerHTML).toBe("$55.98");
    expect(card.querySelector(".cart__product__desc").innerHTML).toBe("2x Unflavored (Original)");
    expect(total()).toBe("$33.76");
    expect(quantity()).toBe("2");

    const pick = (index, id) => {
      const input = selectorInputs(index).find((el) => el.value === id);
      input.checked = true;
      input.dispatchEvent(new window.Event("change"));
    };
    pick(0, "11952");
    // Each unit is its own radio group: unit 2 keeps its default.
    expect(selectorInputs(1).find((el) => el.checked).value).toBe("11951");
    // The $2.00 surcharge applies to the one surcharged unit; newPrice stays the line total.
    expect(total()).toBe("$35.76");
    expect(card.querySelector(".cart__product__new-price").innerHTML).toBe("$35.76");
    expect(steps()[1].querySelector(".cart__steps__step__title-price-wrapper__new-price").innerHTML).toBe("$35.76");
    nextStep();
    pick(1, "11953");
    expect(total()).toBe("$37.76");
    expect(card.querySelector(".cart__product__desc").innerHTML).toBe("Grape Apple (+$2.00)<br>Mango Pineapple (+$2.00)");
    nextStep();
    const href = checkoutParams(location).url.href;
    expect(href).toContain("products[0][id]=201&products[0][quantity]=1&products[0][options][2926]=11952");
    expect(href).toContain("products[1][id]=201&products[1][quantity]=1&products[1][options][2926]=11953");
    expect(href).not.toContain("products[2]");
  });

  it("merges units that end on the same flavor into one checkout line", async () => {
    await open({ products: [{ id: 201, quantity: 2 }] });
    expect($$(".cart__dropdown-selector")).toHaveLength(2);
    steps().forEach((_, index) => {
      const input = selectorInputs(index).find((el) => el.value === "11954");
      input.checked = true;
      input.dispatchEvent(new window.Event("change"));
    });
    expect(cardFor(201).querySelector(".cart__product__desc").innerHTML).toBe("2x Blue Raspberry (+$2.00)");
    expect(total()).toBe("$59.98");
    const href = checkoutParams(location).url.href;
    expect(href).toContain("products[0][id]=201&products[0][quantity]=2&products[0][options][2926]=11954");
    expect(href).not.toContain("products[1]");
  });

  it("puts the recurring period on the first unit only", async () => {
    await open({ products: [{ id: 201, selector: "text", quantity: 2, recurring: { percent: 10, period: 1 } }] });
    const input = selectorInputs(1).find((el) => el.value === "11952");
    input.checked = true;
    input.dispatchEvent(new window.Event("change"));
    const href = checkoutParams(location).url.href;
    expect(href).toContain("products[0][id]=201&products[0][quantity]=1&products[0][product_recurring_id]=1&products[0][options][2926]=11951");
    expect(href).toContain("products[1][id]=201&products[1][quantity]=1&products[1][options][2926]=11952");
    expect(href).not.toMatch(/products\[1\]\[product_recurring_id\]/);
  });

  it("shows no unit counter when the quantity is 1", async () => {
    await open({ products: [{ id: 201 }] });
    expect($(".cart__steps__step__unit")).toBeFalsy();
  });

  it("renders a dropdown by default and image swatches for colors", async () => {
    await open({ products: [{ id: 201 }] });
    expect($(".cart__dropdown-selector")).toBeTruthy();
    resetDom();
    ({ stepCart, data } = await loadModules());
    location = stubLocation();
    await open({ products: [{ id: 924, selector: "colors" }] });
    expect($(".cart__dropdown-selector")).toBeFalsy();
    expect(selectorInputs()).toHaveLength(4);
  });
});

describe("dependent variants", () => {
  it("asks colour and size for each unit and ships one line per unit", async () => {
    await open({ products: [{ id: 935, quantity: 2 }] });
    expect(steps()).toHaveLength(2);
    const pick = (index, wrapperIndex, id) => {
      const input = [...steps()[index].querySelectorAll(".cart__steps__step__selectors-wrapper")[wrapperIndex].querySelectorAll("input")].find((el) => el.value === id);
      input.checked = true;
      input.dispatchEvent(new window.Event("change"));
    };
    pick(0, 0, "8036");
    pick(0, 1, "8039");
    nextStep();
    // Unit 2 still has no size, so it blocks the step and ships nothing yet.
    nextStep();
    expect(stepsText()).toBe("Step 2 of 2");
    expect(checkoutParams(location).url.href).not.toContain("products[1]");
    pick(1, 1, "8037");
    nextStep();
    const href = checkoutParams(location).url.href;
    expect(href).toContain("products[0][id]=935&products[0][quantity]=1&products[0][options][1754]=8036&products[0][options][1755]=8039");
    expect(href).toContain("products[1][id]=935&products[1][quantity]=1&products[1][options][1754]=10454&products[1][options][1755]=8037");
  });

  it("drops a unit's line when a colour change unpicks its size", async () => {
    await open({ products: [{ id: 935, quantity: 2 }] });
    const pick = (index, wrapperIndex, id) => {
      const input = [...steps()[index].querySelectorAll(".cart__steps__step__selectors-wrapper")[wrapperIndex].querySelectorAll("input")].find((el) => el.value === id);
      input.checked = true;
      input.dispatchEvent(new window.Event("change"));
    };
    pick(0, 1, "8040");
    pick(1, 1, "8037");
    expect(data.getProducts()).toHaveLength(2);
    // [8032,8040] is out of stock, so black unpicks unit 1's size.
    pick(0, 0, "8032");
    expect(data.getProducts().map((line) => line.unit)).toEqual([1]);
  });

  it("renders both option levels and blocks advancing until a size is picked", async () => {
    await open({ products: [{ id: 935 }] });
    const wrappers = $$(".cart__steps__step__selectors-wrapper");
    expect(wrappers).toHaveLength(2);
    expect(wrappers[1].hasAttribute("invalid")).toBe(true);
    nextStep();
    expect(stepsText()).toBe("Step 1 of 1");
    expect(wrappers[1].classList.contains("invalid")).toBe(true);
  });

  it("disables sizes that are out of stock for the selected colour", async () => {
    await open({ products: [{ id: 935 }] });
    const [colorWrapper, sizeWrapper] = $$(".cart__steps__step__selectors-wrapper");
    const sizes = [...sizeWrapper.querySelectorAll("input")];
    // 10454 is the first colour with stock across every size, so nothing starts disabled.
    expect(sizes.filter((input) => input.disabled)).toHaveLength(0);
    // 8032 has [8032,8040] = -2 and [8032,8041] = -9.
    const black = [...colorWrapper.querySelectorAll("input")].find((input) => input.value === "8032");
    black.checked = true;
    black.dispatchEvent(new window.Event("change"));
    expect(sizes.filter((input) => input.disabled).map((input) => input.value)).toEqual(["8040", "8041"]);
  });

  it("re-checks cross-disabling when the colour changes and sends both option ids", async () => {
    await open({ products: [{ id: 935 }] });
    const [colorWrapper, sizeWrapper] = $$(".cart__steps__step__selectors-wrapper");
    const green = [...colorWrapper.querySelectorAll("input")].find((input) => input.value === "8036");
    green.checked = true;
    green.dispatchEvent(new window.Event("change"));
    const sizes = [...sizeWrapper.querySelectorAll("input")];
    expect(sizes.some((input) => input.disabled)).toBe(false);
    const large = sizes.find((input) => input.value === "8039");
    large.checked = true;
    large.dispatchEvent(new window.Event("change"));
    expect(sizeWrapper.hasAttribute("invalid")).toBe(false);
    nextStep();
    const { url } = checkoutParams(location);
    expect(url.href).toContain("products[0][options][1754]=8036");
    expect(url.href).toContain("products[0][options][1755]=8039");
  });
});

describe("dynamicQtty quantity behaviour", () => {
  const config = {
    products: [
      { id: 1275, dynamicQtty: { maxQtty: 3, qttyTexts: { 1: "one pack", 2: "two packs", 3: "three packs" } }, attachQtty: [123] },
      { id: 123, newPrice: { value: "FREE" } },
      { id: 201, variant: 11951, newPrice: { value: "FREE" }, isBonus: { parentProd: 1275, parentQtty: 2 } },
      { id: 924, variant: 14003, newPrice: { value: "FREE" }, isBonus: { parentProd: 1275, parentQtty: 3 } },
    ],
    showFullPricing: true,
    showBonus: true,
  };

  it("mirrors the stepper quantity onto attachQtty products and the total", async () => {
    await open(config);
    expect(total()).toBe("$59.99");
    stepper(1275).plus();
    expect(total()).toBe("$119.98");
    // 1275 and 123 at qty 2, plus the 201 bonus at its own list price once unlocked.
    expect(subtotal()).toBe("$287.95");
    const { url } = checkoutParams(location);
    expect(url.href).toContain("products[0][id]=1275&products[0][quantity]=2");
    expect(url.href).toContain("products[1][id]=123&products[1][quantity]=2");
  });

  it("greys locked bonuses and clears the class as each threshold is crossed", async () => {
    await open(config);
    const locked = (id) => cardFor(id).classList.contains("cart__product--locked");
    expect(locked(201)).toBe(true);
    stepper(1275).plus();
    expect(locked(201)).toBe(false);
    expect(locked(924)).toBe(true);
    stepper(1275).plus();
    expect(locked(924)).toBe(false);
    stepper(1275).type(1);
    expect(locked(201)).toBe(true);
    expect(locked(924)).toBe(true);
  });

  it("hides locked bonuses outright when showBonus is off", async () => {
    await open({ ...config, showBonus: false });
    expect(cardFor(201).style.display).toBe("none");
    stepper(1275).plus();
    expect(cardFor(201).style.display).toBe("");
  });

  it("keeps locked bonuses out of the checkout url", async () => {
    await open(config);
    expect(checkoutParams(location).url.href).not.toContain("[id]=201");
    stepper(1275).plus();
    expect(checkoutParams(location).url.href).toContain("[id]=201");
  });

  it("drives the progress bar text, fill and met state", async () => {
    await open(config);
    expect(progressText()).toBe("one pack");
    expect($("[cart-progress-fill]").style.width.startsWith("33.33")).toBe(true);
    stepper(1275).plus();
    expect(progressText()).toBe("two packs");
    expect($("[cart-progress]").classList.contains("cart__progress--met")).toBe(true);
    expect($("[cart-progress-added]").innerHTML).toContain("added");
  });

  it("hides the progress bar when neither qttyTexts nor addedTexts are configured", async () => {
    await open({ products: [{ id: 1275, dynamicQtty: { maxQtty: 3 } }] });
    expect($("[cart-progress]").style.display).toBe("none");
  });
});

describe("addedTexts perks", () => {
  const perkProduct = (addedTexts, extra = {}) => ({
    id: 1275,
    dynamicQtty: { maxQtty: 3, qttyTexts: { 1: "one", 2: "two", 3: "three" }, addedTexts, ...extra },
  });

  it("lists a perk from the quantity that unlocks it and keeps it above that", async () => {
    await open({ products: [perkProduct({ 2: "Free Shipping" })] });
    expect(addedList()).toEqual([]);
    stepper(1275).plus();
    expect(addedList()).toEqual(["<b>Free Shipping</b> added"]);
    stepper(1275).plus();
    expect(addedList()).toEqual(["<b>Free Shipping</b> added"]);
    stepper(1275).type(1);
    expect(addedList()).toEqual([]);
  });

  it("accepts several perks on one tier", async () => {
    await open({ products: [perkProduct({ 3: ["Free Gift", "VIP Access"] })] });
    stepper(1275).type(3);
    expect(addedList()).toEqual(["<b>Free Gift</b> added", "<b>VIP Access</b> added"]);
  });

  it("interleaves perks and product bonuses by quantity, perks first on a tie", async () => {
    await open({
      products: [
        perkProduct({ 2: "Free Shipping", 3: "VIP Access" }),
        { id: 201, variant: 11951, newPrice: { value: "FREE" }, name: "Creatine", isBonus: { parentProd: 1275, parentQtty: 3 } },
      ],
      showBonus: true,
    });
    stepper(1275).type(3);
    expect(addedList()).toEqual(["<b>Free Shipping</b> added", "<b>VIP Access</b> added", "<b>Creatine</b> added"]);
  });

  it("turns the bar green on a perk tier, not just a bonus tier", async () => {
    await open({ products: [perkProduct({ 2: "Free Shipping" })] });
    expect(progressMet()).toBe(false);
    stepper(1275).plus();
    expect(progressMet()).toBe(true);
    stepper(1275).plus();
    expect(progressMet()).toBe(false);
  });

  it("renders the bar for perks alone, with an empty label", async () => {
    await open({ products: [{ id: 1275, dynamicQtty: { maxQtty: 3, addedTexts: { 2: "Free Shipping" } } }] });
    expect($("[cart-progress]").style.display).toBe("");
    expect(progressText()).toBe("");
    stepper(1275).plus();
    expect(addedList()).toEqual(["<b>Free Shipping</b> added"]);
  });

  it("resolves perks at the configured starting quantity", async () => {
    await open({ products: [{ ...perkProduct({ 2: "Free Shipping" }), quantity: 2 }] });
    expect(addedList()).toEqual(["<b>Free Shipping</b> added"]);
  });

  it("keeps markup in a perk string", async () => {
    await open({ products: [perkProduct({ 2: "Free <i>2-day</i> Shipping" })] });
    stepper(1275).plus();
    expect($("[cart-progress-added] i").innerHTML).toBe("2-day");
  });
});

describe("stock handling", () => {
  it("drops an out-of-stock bump silently", async () => {
    resetDom();
    mockFetch({ outOfStock: [123] });
    ({ stepCart, data } = await loadModules());
    location = stubLocation();
    await open({ products: [{ id: 1275 }], bump: { product: { id: 123, newPrice: { value: "$5.00" } } } });
    expect($(".cart__product__bump-button")).toBeFalsy();
    expect(cardFor(1275)).toBeTruthy();
  });

  it("shows the error state when a main product is out of stock", async () => {
    resetDom();
    mockFetch({ outOfStock: [1275] });
    ({ stepCart, data } = await loadModules());
    location = stubLocation();
    await open({ products: [{ id: 1275 }] });
    expect(document.body.innerHTML).not.toContain("cart-products");
  });

  it("shows the error state when a product 404s", async () => {
    resetDom();
    mockFetch({ notFound: [1275] });
    ({ stepCart, data } = await loadModules());
    location = stubLocation();
    await open({ products: [{ id: 1275 }] });
    expect(document.body.innerHTML).not.toContain("cart-products");
  });
});
