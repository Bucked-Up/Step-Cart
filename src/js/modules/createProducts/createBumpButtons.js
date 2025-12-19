import { getBumpWrapper, getGlobalQuantity, getProductsWrapper, getTotalValue, setGlobalQuantity, setTotalValue } from "../data.js";

const createBumpButtons = ({ product, card }) => {
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.innerHTML = "ADD TO CART";
  addButton.classList.add("cart__product__bump-button");
  card.appendChild(addButton);
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.innerHTML = "ADDED TO CART";
  removeButton.classList.add("cart__product__bump-button");
  removeButton.classList.add("remove-button");
  removeButton.style.display = "none";
  card.appendChild(removeButton);
  addButton.addEventListener("click", () => {
    addButton.style.display = "none";
    removeButton.style = "";
    getProductsWrapper().appendChild(card);
    setTotalValue(getTotalValue() + Number(product.configs.newPrice.value.split("$")[1]));
    setGlobalQuantity(getGlobalQuantity() + 1);
  });
  removeButton.addEventListener("click", () => {
    removeButton.style.display = "none";
    addButton.style = "";
    getBumpWrapper().appendChild(card);
    setTotalValue(getTotalValue() - Number(product.configs.newPrice.value.split("$")[1]));
    // removeProduct({ product });
    setGlobalQuantity(getGlobalQuantity() - 1);
  });
  return [addButton, removeButton];
};

export default createBumpButtons;
