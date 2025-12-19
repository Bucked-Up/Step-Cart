import { addRegularProduct, removeProduct } from "../data.js";
import createBumpButtons from "./createBumpButtons.js";
import createDropdownSelector from "./createDropdownSelector.js";
import createProductCard from "./createProductCard.js";

const createRegularProduct = ({ product, isBump }) => {
  const { card, image, name, desc, oldPrice, newPrice } = createProductCard(product);
  let isAdded = false;
  let currentValue = product.options[0].values.find((value) => value.in_stock);
  image.src = currentValue.images[0];
  image.alt = currentValue.name;
  name.innerHTML = product.name;
  const [dropdown, inputs] = createDropdownSelector({ product });
  desc.appendChild(dropdown);
  oldPrice.innerHTML = product.price;
  newPrice.innerHTML = product.configs.newPrice.value;

  inputs.find((input) => input.value == currentValue.id).checked = true;
  inputs.forEach((input) => {
    const value = product.options[0].values.find((value) => input.value == value.id);
    input.addEventListener("change", () => {
      image.src = value.images[0];
      image.alt = value.name;
      currentValue = value;
      if (isAdded) {
        addRegularProduct({ product, choice: `${product.id}-${product.options[0].id}-${currentValue.id}`, replace: true });
      }
    });
  });

  if (isBump) {
    const [addButton, removeButton] = createBumpButtons({ product, card });
    addButton.addEventListener("click", () => {
      isAdded = true;
      addRegularProduct({ product, choice: `${product.id}-${product.options[0].id}-${currentValue.id}`, replace: true });
    });
    removeButton.addEventListener("click", () => {
      isAdded = false;
      removeProduct({ product });
    });
  }
  return card;
};

export default createRegularProduct;
