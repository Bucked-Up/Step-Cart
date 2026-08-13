import {
  addRegularProduct,
  addStaticProduct,
  getApiProducts,
  getBumpCoupon,
  getCouponCode,
  getGlobalQuantity,
  getProductsWrapper,
  getTotalValue,
  removeProduct,
  setCouponCode,
  setGlobalQuantity,
  setTotalValue,
} from "../data.js";
import getPrice from "../utils/getPrice.js";
import createDropdownSelector from "./createDropdownSelector.js";
import createImageColorSelector from "./createImageColorSelector.js";
import createProductCard from "./createProductCard.js";
import createTextSelector from "./createTextSelector.js";
import { setNewPrice, setOldPrice } from "./handleVariantValues.js";
import handleRecurringDescription from "./handleRecurringDescription.js";
import isStatic from "./isStatic.js";

const createBumpStep = ({ product, stepsWrapper, bump }) => {
  const step = document.createElement("div");
  const imageWrapper = document.createElement("div");
  const productInfoWrapper = document.createElement("div");
  const image = document.createElement("img");
  const headline = document.createElement("p");
  const titlePriceWrapper = document.createElement("div");
  const pricesWrapper = document.createElement("div");
  const title = document.createElement("p");
  const oldPriceTitle = document.createElement("p");
  const newPriceTitle = document.createElement("p");
  const buttonRow = document.createElement("div");
  const skipButton = document.createElement("button");
  const addButton = document.createElement("button");

  step.classList.add("cart__steps__step");
  imageWrapper.classList.add("cart__steps__step__image-wrapper");
  productInfoWrapper.classList.add("cart__steps__step__product-info-wrapper");
  image.classList.add("cart__steps__step__image");
  titlePriceWrapper.classList.add("cart__steps__step__title-price-wrapper");
  pricesWrapper.classList.add("cart__steps__step__title-price-wrapper__prices-wrapper");
  oldPriceTitle.classList.add("cart__steps__step__title-price-wrapper__old-price");
  newPriceTitle.classList.add("cart__steps__step__title-price-wrapper__new-price");
  title.classList.add("cart__steps__step__title");
  headline.classList.add("cart__steps__step__headline");
  headline.innerHTML = bump?.title || "UPGRADE YOUR ORDER!";
  buttonRow.classList.add("cart__steps__step__buttons");
  skipButton.type = "button";
  addButton.type = "button";
  skipButton.classList.add("cart__steps__step__button");
  skipButton.classList.add("cart__steps__step__button--skip");
  addButton.classList.add("cart__steps__step__button");
  skipButton.innerHTML = "SKIP";
  addButton.innerHTML = "ADD TO CART";

  step.appendChild(headline);
  step.appendChild(imageWrapper);
  imageWrapper.appendChild(image);
  step.appendChild(productInfoWrapper);
  productInfoWrapper.appendChild(titlePriceWrapper);
  titlePriceWrapper.appendChild(title);
  titlePriceWrapper.appendChild(pricesWrapper);
  pricesWrapper.appendChild(oldPriceTitle);
  pricesWrapper.appendChild(newPriceTitle);

  const { card, image: cardImage, name, desc, oldPrice, newPrice } = createProductCard(product);
  card.style.display = "none";
  getProductsWrapper().appendChild(card);

  title.innerHTML = product.configs.name || product.name;

  const staticBump = isStatic(product);
  let currentValue = null;
  let currentChoice = null;

  if (staticBump) {
    image.src = product.image;
    image.alt = product.name;
    cardImage.src = product.image;
    cardImage.alt = product.name;
    name.innerHTML = product.configs.name || product.name;
    if (product.configs.desc) desc.innerHTML = product.configs.desc;
    handleRecurringDescription({ product, desc });

    if (product.configs.newPrice) {
      oldPriceTitle.innerHTML = product.price;
      newPriceTitle.innerHTML = product.configs.newPrice.value;
      if (product.configs.newPrice.value === "FREE") newPriceTitle.style.color = "#D2232A";
      oldPrice.innerHTML = product.price;
      newPrice.innerHTML = product.configs.newPrice.value;
      if (product.configs.newPrice.value === "FREE") newPrice.style.color = "#D2232A";
    } else {
      newPriceTitle.innerHTML = product.price;
      newPrice.innerHTML = product.price;
    }
  } else {
    currentValue = product.options[0].values.find((value) => value.in_stock);
    currentChoice = `${product.options[0].id}-${currentValue.id}`;
    image.src = currentValue.images[0];
    image.alt = `${product.name} / ${currentValue.name}`;
    cardImage.src = currentValue.images[0];
    cardImage.alt = currentValue.name;
    name.innerHTML = product.configs.name || product.name;
    desc.innerHTML = currentValue.name;
    handleRecurringDescription({ product, desc, value: currentValue });

    if (product.configs.newPrice) {
      setOldPrice(product, oldPriceTitle, currentValue.price);
      setNewPrice(product, newPriceTitle, currentValue.price);
      setOldPrice(product, oldPrice, currentValue.price);
      setNewPrice(product, newPrice, currentValue.price);
    } else {
      setOldPrice(product, newPriceTitle, currentValue.price);
      setOldPrice(product, newPrice, currentValue.price);
    }

    let selectors, inputs, dropdown;
    switch (product.configs.selector) {
      case "text":
        [selectors, inputs] = createTextSelector({ product, image });
        break;
      case "images":
      case "colors":
        [selectors, inputs] = createImageColorSelector({ product, image });
        break;
      default:
        [dropdown, inputs] = createDropdownSelector({ product, image });
        break;
    }
    const selectorsWrapper = document.createElement("div");
    selectorsWrapper.classList.add("cart__steps__step__selectors-wrapper");
    if (selectors) {
      selectors.forEach((selector) => selectorsWrapper.appendChild(selector));
    } else if (dropdown) {
      inputs.find((input) => input.value == currentValue.id).checked = true;
      selectorsWrapper.appendChild(dropdown);
      selectorsWrapper.removeAttribute("class");
    }
    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        const value = product.options[0].values.find((v) => v.id == input.value);
        const newChoice = `${product.options[0].id}-${value.id}`;
        if (applied) {
          const prevVariantPrice = Number(currentValue.price.split("$")[1]);
          const nextVariantPrice = Number(value.price.split("$")[1]);
          const variantDelta = nextVariantPrice - prevVariantPrice;
          if (variantDelta !== 0) {
            setTotalValue(getTotalValue() + variantDelta);
            appliedDelta += variantDelta;
          }
          addRegularProduct({ product, choice: newChoice, replace: true });
        }
        currentValue = value;
        currentChoice = newChoice;
        cardImage.src = value.images[0];
        cardImage.alt = value.name;
        desc.innerHTML = value.name;
        handleRecurringDescription({ product, desc, value });
        if (product.configs.newPrice) {
          setOldPrice(product, oldPriceTitle, value.price);
          setNewPrice(product, newPriceTitle, value.price);
          setOldPrice(product, oldPrice, value.price);
          setNewPrice(product, newPrice, value.price);
        } else {
          setOldPrice(product, newPriceTitle, value.price);
          setOldPrice(product, newPrice, value.price);
        }
      });
    });
    productInfoWrapper.appendChild(selectorsWrapper);
  }

  step.appendChild(buttonRow);
  buttonRow.appendChild(skipButton);
  buttonRow.appendChild(addButton);
  stepsWrapper.appendChild(step);

  let applied = false;
  let prevCoupon = null;
  let appliedDelta = 0;
  const savedPrices = [];

  const applyChangePrices = () => {
    let delta = 0;
    savedPrices.length = 0;
    if (!product.configs.changePrices) return delta;
    const apiProducts = getApiProducts();
    product.configs.changePrices.forEach(({ id, newPrice: nextPrice }) => {
      const target = apiProducts.find((p) => p.id == id);
      if (!target) return;
      const priceEl = document.querySelector(`.cart__product__new-price[prod-id="${target.id}"]`);
      if (!priceEl) return;
      const originalPrice = getPrice(target.configs.newPrice?.value || target.price);
      savedPrices.push({ id: target.id, price: originalPrice, priceEl });
      if (nextPrice === "FREE") priceEl.style.color = "#D2232A";
      priceEl.innerHTML = nextPrice;
      delta -= nextPrice === "FREE" ? originalPrice : originalPrice - getPrice(nextPrice);
    });
    return delta;
  };

  const revertChangePrices = () => {
    savedPrices.forEach(({ price, priceEl }) => {
      priceEl.style = "";
      priceEl.innerHTML = `$${price}`;
    });
    savedPrices.length = 0;
  };

  const apply = () => {
    if (applied) return;
    applied = true;
    prevCoupon = getCouponCode();
    setCouponCode(getBumpCoupon());
    const bumpAddDelta = getPrice(product.configs.newPrice.value) + (!staticBump && currentValue ? Number(currentValue.price.split("$")[1]) : 0);
    const changePricesDelta = applyChangePrices();
    appliedDelta = bumpAddDelta + changePricesDelta;
    setTotalValue(getTotalValue() + appliedDelta);
    setGlobalQuantity(getGlobalQuantity() + 1);
    if (staticBump) addStaticProduct({ product });
    else addRegularProduct({ product, choice: currentChoice, replace: true });
    card.style.display = "";
  };

  const revert = () => {
    if (!applied) return;
    applied = false;
    setCouponCode(prevCoupon);
    revertChangePrices();
    setTotalValue(getTotalValue() - appliedDelta);
    setGlobalQuantity(getGlobalQuantity() - 1);
    removeProduct({ product });
    card.style.display = "none";
    appliedDelta = 0;
  };

  return { step, addButton, skipButton, apply, revert };
};

export default createBumpStep;
