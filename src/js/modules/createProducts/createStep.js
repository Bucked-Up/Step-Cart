import { addRegularProduct, getProductsWrapper, getTotalValue, removeProduct, setTotalValue } from "../data.js";
import getPrice from "../utils/getPrice.js";
import createDropdownSelector from "./createDropdownSelector.js";
import createImageColorSelector from "./createImageColorSelector.js";
import createProductCard from "./createProductCard.js";
import createSizeSelectors from "./createSizeSelectors.js";
import createTextSelector from "./createTextSelector.js";
import handleRecurringDescription from "./handleRecurringDescription.js";
import isDependent from "./isDepentent.js";

// A variant product renders one step per unit of its configured quantity, so each unit gets
// its own selection (two tubs, two flavors). The units share one cart card and ship as
// separate cart lines; handlePurchase merges units that end up with the same choice.
const createStep = ({ product, stepsWrapper }) => {
  const dependent = isDependent(product);
  const dependentOutOfStock = (value1, value2) => product.stock[Object.keys(product.stock).find((key) => key.includes(value1) && key.includes(value2))] <= 0;
  const qty = product.configs.quantity || 1;

  const { card, image: cardImage, name, desc, oldPrice, newPrice, quantity } = createProductCard(product);
  if (qty > 1) {
    quantity.innerHTML = qty;
    quantity.style.display = "";
  }
  getProductsWrapper().appendChild(card);

  const firstAvailableValue = dependent
    ? product.options[0].values.find((value) => Object.keys(product.stock).some((key) => key.includes(value.id) && product.stock[key] > 0))
    : product.options[0].values.find((value) => value.in_stock);

  // newPrice.value is the price of the full line; each unit adds its own variant surcharge.
  const basePart = product.configs.newPrice ? getPrice(product.configs.newPrice.value) : getPrice(product.price) * qty;
  // A dependent unit is priced by its secondary value once one is picked.
  const surchargeOf = (unit) => getPrice((unit.secondary || unit.primary).price);
  const labelOf = (unit) => (unit.secondary ? `${unit.primary.name}<br>${unit.secondary.name}` : unit.primary.name);
  const units = [];
  const priceTitles = [];
  let contribution = 0;

  const refresh = () => {
    const surcharges = units.reduce((sum, unit) => sum + surchargeOf(unit), 0);
    setTotalValue(getTotalValue() + basePart + surcharges - contribution);
    contribution = basePart + surcharges;

    const oldText = `$${(getPrice(product.price) * qty + surcharges).toFixed(2)}`;
    if (product.configs.newPrice) {
      oldPrice.innerHTML = oldText;
      newPrice.style = "";
      if (surcharges === 0) {
        newPrice.innerHTML = product.configs.newPrice.value;
        if (product.configs.newPrice.value === "FREE") newPrice.style.color = "#D2232A";
      } else {
        newPrice.innerHTML = `$${(surcharges + basePart).toFixed(2)}`;
      }
    } else {
      newPrice.innerHTML = oldText;
    }
    priceTitles.forEach(([oldTitle, newTitle]) => {
      if (product.configs.newPrice) oldTitle.innerHTML = oldPrice.innerHTML;
      newTitle.innerHTML = newPrice.innerHTML;
    });

    cardImage.src = units[0].primary.images[0];
    cardImage.alt = units[0].primary.name;
    name.innerHTML = product.configs.name || product.name;
    // Equal choices read as one "2x Flavor" line instead of the same name twice.
    const counts = new Map();
    units.forEach((unit) => counts.set(labelOf(unit), (counts.get(labelOf(unit)) || 0) + 1));
    desc.innerHTML = [...counts].map(([label, count]) => (count > 1 ? `${count}x ${label}` : label)).join("<br>");
    handleRecurringDescription({ product, desc, value: units[0].secondary || units[0].primary });
  };

  const createUnitStep = (index) => {
    const unit = { primary: firstAvailableValue, secondary: null };
    units.push(unit);
    const addLine = () => {
      const choice = unit.secondary ? `${product.options[0].id}-${unit.primary.id}/${product.options[1].id}-${unit.secondary.id}` : `${product.options[0].id}-${unit.primary.id}`;
      addRegularProduct({ product, choice, replace: true, unit: index });
    };
    // A dependent unit has no line until its secondary value is picked, and loses it again
    // when a primary change unpicks an out-of-stock secondary.
    const removeLine = () => removeProduct({ product, unit: index });
    if (!dependent) addLine();

    const step = document.createElement("div");
    const imageWrapper = document.createElement("div");
    const productInfoWrapper = document.createElement("div");
    const image = document.createElement("img");
    const titlePriceWrapper = document.createElement("div");
    const pricesWrapper = document.createElement("div");
    const title = document.createElement("p");
    const button = document.createElement("button");
    const oldPriceTitle = document.createElement("p");
    const newPriceTitle = document.createElement("p");
    priceTitles.push([oldPriceTitle, newPriceTitle]);

    titlePriceWrapper.appendChild(title);
    titlePriceWrapper.classList.add("cart__steps__step__title-price-wrapper");
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

    image.src = firstAvailableValue.images[0];
    image.alt = `${product.name} / ${firstAvailableValue.name}`;
    title.innerHTML = `Choose your ${product.name}:`;
    button.innerHTML = "NEXT STEP";

    step.appendChild(imageWrapper);
    step.appendChild(productInfoWrapper);
    productInfoWrapper.appendChild(titlePriceWrapper);
    // Which unit this step picks for, on its own line under the title.
    if (qty > 1) {
      const unitText = document.createElement("p");
      unitText.classList.add("cart__steps__step__unit");
      unitText.innerHTML = `Step ${index + 1} of ${qty}`;
      productInfoWrapper.appendChild(unitText);
    }
    imageWrapper.appendChild(image);

    let selectors, inputs, dropdown;
    let secondaryInputs;
    let secondarySelectorsWrapper;

    switch (product.configs.selector) {
      case "text":
        [selectors, inputs] = createTextSelector({ product, image, unit: index });
        break;
      case "images":
      case "colors":
        [selectors, inputs] = createImageColorSelector({ product, image, unit: index });
        break;
      default:
        if (dependent) [selectors, inputs] = createImageColorSelector({ product, image, unit: index });
        else [dropdown, inputs] = createDropdownSelector({ product, image, unit: index });
        break;
    }
    const selectorsWrapper = document.createElement("div");
    selectorsWrapper.classList.add("cart__steps__step__selectors-wrapper");
    if (selectors)
      selectors.forEach((selector) => {
        selectorsWrapper.appendChild(selector);
      });
    else if (dropdown) {
      inputs.find((input) => input.value == firstAvailableValue.id).checked = true;
      selectorsWrapper.appendChild(dropdown);
      selectorsWrapper.removeAttribute("class");
    }
    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        unit.primary = product.options[0].values.find((value) => value.id == input.value);
        if (dependent) {
          secondaryInputs.forEach((input) => {
            input.removeAttribute("disabled");
            if (dependentOutOfStock(input.value, unit.primary.id)) {
              input.setAttribute("disabled", "disabled");
              if (input.checked) {
                input.checked = false;
                unit.secondary = null;
                secondarySelectorsWrapper.setAttribute("invalid", "invalid");
                removeLine();
              }
            }
          });
          if (unit.secondary) addLine();
        } else {
          addLine();
        }
        refresh();
      });
    });
    productInfoWrapper.appendChild(selectorsWrapper);

    if (dependent) {
      const [selectors, inputs] = createSizeSelectors({ product, unit: index });
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
          unit.secondary = product.options[1].values.find((value) => value.id == input.value);
          selectorsWrapper.removeAttribute("invalid");
          selectorsWrapper.classList.remove("invalid");
          addLine();
          refresh();
        });
      });
    }

    if (!stepsWrapper.hasAttribute("inline-products")) step.appendChild(button);
    stepsWrapper.appendChild(step);

    return [step, button];
  };

  const steps = [];
  const buttons = [];
  for (let index = 0; index < qty; index++) {
    const [step, button] = createUnitStep(index);
    steps.push(step);
    buttons.push(button);
  }
  refresh();

  return { steps, buttons };
};

export default createStep;
