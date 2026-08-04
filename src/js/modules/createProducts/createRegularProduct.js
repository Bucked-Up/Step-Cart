import { addRegularProduct, getTotalValue, removeProduct, setTotalValue } from "../data.js";
import createBumpButtons from "./createBumpButtons.js";
import createDropdownSelector from "./createDropdownSelector.js";
import createProductCard from "./createProductCard.js";
import { setNewPrice, setOldPrice, updateVariantValue } from "./handleVariantValues.js";

const createRegularProduct = ({ product, isBump }) => {
  const { card, image, name, desc, oldPrice, newPrice } = createProductCard(product, isBump);
  let isAdded = false;
  let currentValue = product.options[0].values.find((value) => value.in_stock);
  image.src = currentValue.images[0];
  image.alt = currentValue.name;
  name.innerHTML = product.configs.name || product.name;
  const [dropdown, inputs] = createDropdownSelector({ product, image });
  desc.appendChild(dropdown);
  if (product.configs.newPrice) {
    oldPrice.innerHTML = product.price;
    newPrice.innerHTML = product.configs.newPrice.value;
    if (product.configs.newPrice.value === "FREE") newPrice.style.color = "#D2232A";
  } else {
    newPrice.innerHTML = product.price;
  }

  const subscribers = [];
  const getChoice = () => `${product.options[0].id}-${currentValue.id}`;
  const getVariantPrice = () => Number(currentValue.price.split("$")[1]);

  inputs.find((input) => input.value == currentValue.id).checked = true;
  inputs.forEach((input) => {
    const value = product.options[0].values.find((value) => input.value == value.id);
    input.addEventListener("change", () => {
      currentValue = value;
      if (isAdded) {
        updateVariantValue(product, value);
        addRegularProduct({ product, choice: getChoice(), replace: true });
      }
      if (product.configs.newPrice) {
        setOldPrice(product, oldPrice, value.price);
        setNewPrice(product, newPrice, value.price);
      } else {
        setOldPrice(product, newPrice, value.price);
      }
      subscribers.forEach((fn) => fn({ value, choice: getChoice() }));
    });
  });

  if (isBump) {
    const [addButton, removeButton] = createBumpButtons({ product, card });
    addButton.addEventListener("click", () => {
      isAdded = true;
      addRegularProduct({ product, choice: getChoice(), replace: true });
      setTotalValue(getTotalValue() + Number(product.options[0].values.find((value) => value.id == inputs.find((input) => input.checked).value).price.split("$")[1])) || 0;
    });
    removeButton.addEventListener("click", () => {
      isAdded = false;
      removeProduct({ product });
      setTotalValue(getTotalValue() - Number(product.options[0].values.find((value) => value.id == inputs.find((input) => input.checked).value).price.split("$")[1])) || 0;
    });
  }
  return { card, getChoice, getVariantPrice, subscribe: (fn) => subscribers.push(fn) };
};

export default createRegularProduct;
