import { addRegularProduct } from "../data.js";
import createImageColorSelector from "./createImageColorSelector.js";
import createProductCard from "./createProductCard.js";
import createSizeSelectors from "./createSizeSelectors.js";
import isDependent from "./isDepentent.js";

const createStep = ({ product, stepsWrapper, wrapper }) => {
  const dependentOutOfStock = (value1, value2) => product.stock[Object.keys(product.stock).find((key) => key.includes(value1) && key.includes(value2))] <= 0;
  const setOldPrice = (el, price) => (el.innerHTML = `$${(Number(product.price.split("$")[1]) + Number(price.split("$")[1])).toFixed(2)}`);
  const setNewPrice = (el, price) => {
    if (Number(price.split("$")[1]) === 0) {
      el.innerHTML = product.configs.newPrice.value;
      return;
    }
    const newPrice = product.configs.newPrice.value === "FREE" ? `$0.00` : product.configs.newPrice.value;
    el.innerHTML = `$${(Number(price.split("$")[1]) + Number(newPrice.split("$")[1])).toFixed(2)}`;
  };

  const step = document.createElement("div");
  const imageWrapper = document.createElement("div");
  const image = document.createElement("img");
  const title = document.createElement("p");
  const subTitle = document.createElement("p");
  const button = document.createElement("button");
  const { card, image: cardImage, name, desc, oldPrice, newPrice } = createProductCard();
  wrapper.appendChild(card);

  step.classList.add("cart__steps__step");
  imageWrapper.classList.add("cart__steps__step__image-wrapper");
  image.classList.add("cart__steps__step__image");
  title.classList.add("cart__steps__step__title");
  subTitle.classList.add("cart__steps__step__sub-title");
  button.classList.add("cart__steps__step__button");
  button.type = "button";

  let firstAvailableValue;
  let currentPrimaryValue;
  let primaryInputs;
  let secondaryInputs;
  let secondarySelectorsWrapper;

  if (isDependent(product)) {
    const values = product.options[0].values;
    firstAvailableValue = values.find((value) => Object.keys(product.stock).some((key) => key.includes(value.id) && product.stock[key] > 0));
    const secondaryValue = product.options[1].values.find((value) => Object.keys(product.stock).some((key) => key.includes(value.id) && key.includes(firstAvailableValue.id) && product.stock[key] > 0));
    addRegularProduct({ product, choice: `${product.options[0].id}-${firstAvailableValue.id}/${product.options[1].id}-${secondaryValue.id}`, replace: true });
    currentPrimaryValue = firstAvailableValue;
  } else {
    firstAvailableValue = product.options[0].values.find((value) => value.in_stock);
    addRegularProduct({ product, choice: `${product.options[0].id}-${firstAvailableValue.id}`, replace: true });
  }

  cardImage.src = firstAvailableValue.images[0];
  cardImage.alt = firstAvailableValue.name;
  name.innerHTML = product.name;
  desc.innerHTML = firstAvailableValue.name;
  setOldPrice(oldPrice, firstAvailableValue.price);
  setNewPrice(newPrice, firstAvailableValue.price);

  image.src = firstAvailableValue.images[0];
  image.alt = `${product.name} / ${firstAvailableValue.name}`;
  title.innerHTML = `Choose your ${product.name}:`;
  subTitle.innerHTML = firstAvailableValue.name;
  button.innerHTML = "NEXT STEP";

  step.appendChild(imageWrapper);
  step.appendChild(title);
  step.appendChild(subTitle);
  imageWrapper.appendChild(image);
  console.log(product);

  if (product.configs.selector === "images" || product.configs.selector === "colors" || isDependent(product)) {
    const [selectors, inputs] = createImageColorSelector({ product, image, subTitle });
    primaryInputs = inputs;
    const selectorsWrapper = document.createElement("div");
    selectorsWrapper.classList.add("cart__steps__step__selectors-wrapper");
    selectors.forEach((selector) => {
      selectorsWrapper.appendChild(selector);
    });
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
        } else {
          addRegularProduct({ product, choice: `${product.options[0].id}-${input.value}`, replace: true });
          setOldPrice(oldPrice, value.price);
          setNewPrice(newPrice, value.price);
          cardImage.src = value.images[0];
          cardImage.alt = value.name;
          name.innerHTML = product.name;
          desc.innerHTML = value.name;
        }
      });
    });
    step.appendChild(selectorsWrapper);

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
      step.appendChild(selectorsWrapper);
      inputs.forEach((input) => {
        if (dependentOutOfStock(input.value, firstAvailableValue.id)) {
          input.setAttribute("disabled", "disabled");
        }

        input.addEventListener("change", () => {
          const value = product.options[1].values.find((value) => value.id == input.value);
          setOldPrice(oldPrice, value.price);
          setNewPrice(newPrice, value.price);
          selectorsWrapper.removeAttribute("invalid");
          selectorsWrapper.classList.remove("invalid");
          addRegularProduct({ product, choice: `${product.options[0].id}-${inputs.find((input) => input.checked).value}/${product.options[1].id}-${input.value}`, replace: true });
          cardImage.src = currentPrimaryValue.images[0];
          cardImage.alt = currentPrimaryValue.name;
          name.innerHTML = product.name;
          desc.innerHTML = `${currentPrimaryValue.name}<br>${value.name}`;
        });
      });
    }
  }

  step.appendChild(button);
  stepsWrapper.appendChild(step);

  return [step, button];
};

export default createStep;
