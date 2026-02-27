import { addRegularProduct, getProductsWrapper, getTotalValue, setTotalValue } from "../data.js";
import getPrice from "../utils/getPrice.js";
import createDropdownSelector from "./createDropdownSelector.js";
import createImageColorSelector from "./createImageColorSelector.js";
import createProductCard from "./createProductCard.js";
import createSizeSelectors from "./createSizeSelectors.js";
import createTextSelector from "./createTextSelector.js";
import handleRecurringDescription from "./handleRecurringDescription.js";
import { setNewPrice, setOldPrice, updateVariantValue } from "./handleVariantValues.js";
import isDependent from "./isDepentent.js";

const createStep = ({ product, stepsWrapper, noSelection }) => {
  const dependentOutOfStock = (value1, value2) => product.stock[Object.keys(product.stock).find((key) => key.includes(value1) && key.includes(value2))] <= 0;

  const step = document.createElement("div");
  const imageWrapper = document.createElement("div");
  const productInfoWrapper = document.createElement("div");
  const image = document.createElement("img");
  const titlePriceWrapper = document.createElement("div");
  const pricesWrapper = document.createElement("div");
  const title = document.createElement("p");
  const button = document.createElement("button");
  const { card, image: cardImage, name, desc, oldPrice, newPrice } = createProductCard(product);
  getProductsWrapper().appendChild(card);

  titlePriceWrapper.appendChild(title);
  titlePriceWrapper.classList.add("cart__steps__step__title-price-wrapper");
  const oldPriceTitle = document.createElement("p");
  const newPriceTitle = document.createElement("p");
  pricesWrapper.appendChild(oldPriceTitle);
  pricesWrapper.appendChild(newPriceTitle);
  titlePriceWrapper.appendChild(pricesWrapper);
  pricesWrapper.classList.add("cart__steps__step__title-price-wrapper__prices-wrapper");
  oldPriceTitle.classList.add("cart__steps__step__title-price-wrapper__old-price");
  newPriceTitle.classList.add("cart__steps__step__title-price-wrapper__new-price");

  step.classList.add("cart__steps__step");
  productInfoWrapper.classList.add("cart__steps__step__product-info-wrapper");
  imageWrapper.classList.add("cart__steps__step__image-wrapper");
  image.classList.add("cart__steps__step__image");
  title.classList.add("cart__steps__step__title");
  button.classList.add("cart__steps__step__button");
  button.type = "button";

  let firstAvailableValue;
  let currentPrimaryValue;
  let primaryInputs;
  let secondaryInputs;
  let secondarySelectorsWrapper;

  if (product.configs.newPrice && product.configs.newPrice.value !== "FREE") setTotalValue(getTotalValue() + Number(product.configs.newPrice.value.split("$")[1]));
  else if (!product.configs.newPrice) setTotalValue(getTotalValue() + getPrice(product.price));

  if (isDependent(product)) {
    const values = product.options[0].values;
    firstAvailableValue = values.find((value) => Object.keys(product.stock).some((key) => key.includes(value.id) && product.stock[key] > 0));
    currentPrimaryValue = firstAvailableValue;
  } else {
    firstAvailableValue = product.options[0].values.find((value) => value.in_stock);
    addRegularProduct({ product, choice: `${product.options[0].id}-${firstAvailableValue.id}`, replace: true });
  }

  cardImage.src = firstAvailableValue.images[0];
  cardImage.alt = firstAvailableValue.name;
  name.innerHTML = product.configs.name || product.name;
  desc.innerHTML = firstAvailableValue.name;
  handleRecurringDescription({ product, desc, value: firstAvailableValue });
  if (product.configs.newPrice) {
    setOldPrice(product, oldPrice, firstAvailableValue.price);
    setNewPrice(product, newPrice, firstAvailableValue.price);
    oldPriceTitle.innerHTML = oldPrice.innerHTML;
    newPriceTitle.innerHTML = newPrice.innerHTML;
  } else {
    setOldPrice(product, newPrice, firstAvailableValue.price);
    newPriceTitle.innerHTML = newPrice.innerHTML;
  }

  image.src = firstAvailableValue.images[0];
  image.alt = `${product.name} / ${firstAvailableValue.name}`;
  title.innerHTML = `Choose your ${product.name}:`;
  button.innerHTML = "NEXT STEP";

  step.appendChild(imageWrapper);
  step.appendChild(productInfoWrapper);
  productInfoWrapper.appendChild(titlePriceWrapper);
  imageWrapper.appendChild(image);

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
      if (isDependent(product)) [selectors, inputs] = createImageColorSelector({ product, image });
      else [dropdown, inputs] = createDropdownSelector({ product, image });
      break;
  }
  primaryInputs = inputs;
  const selectorsWrapper = document.createElement("div");
  selectorsWrapper.classList.add("cart__steps__step__selectors-wrapper");
  if (selectors)
    selectors.forEach((selector) => {
      selectorsWrapper.appendChild(selector);
    });
  else if (dropdown) {
    selectorsWrapper.appendChild(dropdown);
    selectorsWrapper.removeAttribute("class");
  }
  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      const value = product.options[0].values.find((value) => value.id == input.value);
      if (isDependent(product)) {
        currentPrimaryValue = value;
        secondaryInputs.forEach((input) => {
          input.removeAttribute("disabled");
          if (dependentOutOfStock(input.value, value.id)) {
            input.setAttribute("disabled", "disabled");
            if (input.checked) {
              input.checked = false;
              secondarySelectorsWrapper.setAttribute("invalid", "invalid");
            }
          }
        });
        const currentSecondaryInput = secondaryInputs.find((input) => input.checked);
        if (currentSecondaryInput) {
          addRegularProduct({ product, choice: `${product.options[0].id}-${input.value}/${product.options[1].id}-${currentSecondaryInput.value}`, replace: true });
          cardImage.src = currentPrimaryValue.images[0];
          cardImage.alt = currentPrimaryValue.name;
          name.innerHTML = product.configs.name || product.name;
          const value = product.options[1].values.find((value) => value.id == currentSecondaryInput.value);
          desc.innerHTML = `${currentPrimaryValue.name}<br>${value.name}`;
          handleRecurringDescription({ product, desc, value });
        }
      } else {
        addRegularProduct({ product, choice: `${product.options[0].id}-${input.value}`, replace: true });
        updateVariantValue(product, value);
        if (product.configs.newPrice) {
          setOldPrice(product, oldPrice, value.price);
          setNewPrice(product, newPrice, value.price);
          oldPriceTitle.innerHTML = oldPrice.innerHTML;
          newPriceTitle.innerHTML = newPrice.innerHTML;
        } else {
          setOldPrice(product, newPrice, value.price);
          newPriceTitle.innerHTML = newPrice.innerHTML;
        }
        cardImage.src = value.images[0];
        cardImage.alt = value.name;
        name.innerHTML = product.configs.name || product.name;
        desc.innerHTML = value.name;
        handleRecurringDescription({ product, desc, value });
      }
    });
  });
  productInfoWrapper.appendChild(selectorsWrapper);

  if (isDependent(product)) {
    const [selectors, inputs] = createSizeSelectors({ product });
    secondaryInputs = inputs;
    const selectorsWrapper = document.createElement("div");
    secondarySelectorsWrapper = selectorsWrapper;
    selectorsWrapper.setAttribute("invalid", "invalid");
    selectorsWrapper.classList.add("cart__steps__step__selectors-wrapper");
    selectors.forEach((selector) => {
      selectorsWrapper.appendChild(selector);
    });
    const title = document.createElement("p");
    title.innerHTML = product.options[1].name;
    productInfoWrapper.appendChild(title);
    title.classList.add("cart__steps__step__title");
    title.classList.add("margin-bottom");
    productInfoWrapper.appendChild(selectorsWrapper);
    inputs.forEach((input) => {
      if (dependentOutOfStock(input.value, firstAvailableValue.id)) {
        input.setAttribute("disabled", "disabled");
      }

      input.addEventListener("change", () => {
        const value = product.options[1].values.find((value) => value.id == input.value);
        updateVariantValue(product, value);
        if (product.configs.newPrice) {
          setOldPrice(product, oldPrice, value.price);
          setNewPrice(product, newPrice, value.price);
          oldPriceTitle.innerHTML = oldPrice.innerHTML;
          newPriceTitle.innerHTML = newPrice.innerHTML;
        } else {
          setOldPrice(product, newPrice, value.price);
          newPriceTitle.innerHTML = newPrice.innerHTML;
        }
        selectorsWrapper.removeAttribute("invalid");
        selectorsWrapper.classList.remove("invalid");
        addRegularProduct({ product, choice: `${product.options[0].id}-${primaryInputs.find((input) => input.checked).value}/${product.options[1].id}-${input.value}`, replace: true });
        cardImage.src = currentPrimaryValue.images[0];
        cardImage.alt = currentPrimaryValue.name;
        name.innerHTML = product.configs.name || product.name;
        desc.innerHTML = `${currentPrimaryValue.name}<br>${value.name}`;
        handleRecurringDescription({ product, desc, value });
      });
    });
  }

  if (!stepsWrapper.hasAttribute("inline-products")) step.appendChild(button);
  stepsWrapper.appendChild(step);

  return [step, button];
};

export default createStep;
