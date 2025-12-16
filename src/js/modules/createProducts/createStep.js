import { addRegularProduct } from "../data.js";
import createImageColorSelector from "./createImageColorSelector.js";
import createProductCard from "./createProductCard.js";
import isDependent from "./isDepentent.js";

const createStep = ({ product, stepsWrapper, wrapper }) => {
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

  let availableValue;
  let currentPrimaryValue;

  if (isDependent(product)) {
    const values = product.options[0].values;
    availableValue = values.find((value) => Object.keys(product.stock).some((key) => key.includes(value.id) && product.stock[key] > 0));
    const secondaryValue = product.options[1].values.find((value) => Object.keys(product.stock).some((key) => key.includes(value.id) && key.includes(availableValue.id) && product.stock[key] > 0));
    addRegularProduct({ product, choice: `${product.options[0].id}-${availableValue.id}/${product.options[1].id}-${secondaryValue.id}`, replace: true });
    currentPrimaryValue = availableValue;
  } else {
    availableValue = product.options[0].values.find((value) => value.in_stock);
    addRegularProduct({ product, choice: `${product.options[0].id}-${availableValue.id}`, replace: true });
  }

  cardImage.src = availableValue.images[0];
  cardImage.alt = availableValue.name;
  name.innerHTML = product.name;
  desc.innerHTML = availableValue.name;

  image.src = availableValue.images[0];
  image.alt = `${product.name} / ${availableValue.name}`;
  title.innerHTML = `Choose your ${product.name}:`;
  subTitle.innerHTML = availableValue.name;
  button.innerHTML = "NEXT STEP";

  step.appendChild(imageWrapper);
  step.appendChild(title);
  step.appendChild(subTitle);
  imageWrapper.appendChild(image);

  if (product.selector === "images" || product.selector === "colors" || isDependent(product)) {
    const [selectors, inputs] = createImageColorSelector({ product, image, subTitle });
    const selectorsWrapper = document.createElement("div");
    selectorsWrapper.classList.add("cart__steps__step__color-image-selectors");
    selectors.forEach((selector) => {
      selectorsWrapper.appendChild(selector);
    });
    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        const value = product.options[0].values.find((value) => value.id == input.value);
        if (isDependent(product)) currentPrimaryValue = input.value;
        else addRegularProduct({ product, choice: `${product.options[0].id}-${input.value}`, replace: true });
        cardImage.src = value.images[0];
        cardImage.alt = value.name;
        name.innerHTML = product.name;
        desc.innerHTML = value.name;
      });
    });
    step.appendChild(selectorsWrapper);
  }

  step.appendChild(button);
  stepsWrapper.appendChild(step);

  return [step, button];
};

export default createStep;
