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
  const [dropdown, inputs] = createDropdownSelector({ product });
  desc.appendChild(dropdown);
  if (product.configs.newPrice) {
    oldPrice.innerHTML = product.price;
    newPrice.innerHTML = product.configs.newPrice.value;
  } else {
    newPrice.innerHTML = product.price;
  }

  inputs.find((input) => input.value == currentValue.id).checked = true;
  inputs.forEach((input) => {
    const value = product.options[0].values.find((value) => input.value == value.id);
    input.addEventListener("change", () => {
      image.src = value.images[0];
      image.alt = value.name;
      currentValue = value;
      if (isAdded) {
        updateVariantValue(product, value);
        addRegularProduct({ product, choice: `${product.options[0].id}-${currentValue.id}`, replace: true });
      }
      if (product.configs.newPrice) {
        setOldPrice(product, oldPrice, value.price);
        setNewPrice(product, newPrice, value.price);
      } else {
        setOldPrice(product, newPrice, value.price);
      }
    });
  });

  if (isBump) {
    const [addButton, removeButton] = createBumpButtons({ product, card });
    addButton.addEventListener("click", () => {
      isAdded = true;
      addRegularProduct({ product, choice: `${product.options[0].id}-${currentValue.id}`, replace: true });
      setTotalValue(getTotalValue() + Number(product.options[0].values.find((value) => value.id == inputs.find((input) => input.checked).value).price.split("$")[1])) || 0;
    });
    removeButton.addEventListener("click", () => {
      isAdded = false;
      removeProduct({ product });
      setTotalValue(getTotalValue() - Number(product.options[0].values.find((value) => value.id == inputs.find((input) => input.checked).value).price.split("$")[1])) || 0;
    });
  }
  return card;
};

export default createRegularProduct;
