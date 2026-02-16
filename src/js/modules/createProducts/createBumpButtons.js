import { getApiProducts, getBumpCoupon, getBumpWrapper, getCouponCode, getGlobalQuantity, getProductsWrapper, getTotalValue, setCouponCode, setGlobalQuantity, setTotalValue } from "../data.js";
import getPrice from "../utils/getPrice.js";

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
  let prevCoupon = getCouponCode();
  let oldProductsValue = 0;
  const products = getApiProducts();
  const productsPrices = [];
  if (product.configs.changePrices) {
    product.configs.changePrices.forEach((newPrice) => {
      const product = products.find((prod) => prod.id == newPrice.id);
      console.log(product);
      oldProductsValue += getPrice(product.price);
    });
  }
  addButton.addEventListener("click", () => {
    setCouponCode(getBumpCoupon());
    addButton.style.display = "none";
    removeButton.style = "";
    getProductsWrapper().appendChild(card);
    let newTotal = getTotalValue() + getPrice(product.configs.newPrice.value);
    if (product.configs.changePrices) {
      product.configs.changePrices.forEach((newPrice) => {
        const product = products.find((prod) => prod.id == newPrice.id);
        const priceEl = document.querySelector(`.cart__product__new-price[prod-id="${product.id}"]`);
        if (newPrice.newPrice == "FREE") priceEl.style.color = "#D2232A";
        priceEl.innerHTML = newPrice.newPrice;
        const productPrice = getPrice(product.configs.newPrice.value || product.price);
        productsPrices.push({ id: product.id, price: productPrice });
        newTotal = newTotal - (newPrice.newPrice == "FREE" ? productPrice : productPrice - getPrice(newPrice.newPrice));
      });
    }
    setTotalValue(newTotal);
    setGlobalQuantity(getGlobalQuantity() + 1);
  });
  removeButton.addEventListener("click", () => {
    setCouponCode(prevCoupon);
    removeButton.style.display = "none";
    addButton.style = "";
    getBumpWrapper().appendChild(card);
    let newTotal = getTotalValue() - getPrice(product.configs.newPrice.value);
    if (product.configs.changePrices) {
      product.configs.changePrices.forEach((newPrice) => {
        const product = products.find((prod) => prod.id == newPrice.id);
        const priceEl = document.querySelector(`.cart__product__new-price[prod-id="${product.id}"]`);
        priceEl.style = "";
        const oldPrice = productsPrices.find((el) => el.id == product.id).price;
        priceEl.innerHTML = `$${oldPrice}`;
        newTotal = newTotal + (newPrice.newPrice == "FREE" ? oldPrice : oldPrice - getPrice(newPrice.newPrice));
      });
    }
    setTotalValue(newTotal);
    setGlobalQuantity(getGlobalQuantity() - 1);
  });
  return [addButton, removeButton];
};

export default createBumpButtons;
