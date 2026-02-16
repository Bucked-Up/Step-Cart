import { getTotalValue, setTotalValue } from "../data.js";

let currentVariantPrice = {};

const updateVariantValue = (product, variant) => {
  if (!currentVariantPrice[product.id]) currentVariantPrice[product.id] = 0;
  setTotalValue(getTotalValue() - currentVariantPrice[product.id]);
  currentVariantPrice[product.id] = Number(variant.price.split("$")[1]);
  setTotalValue(getTotalValue() + currentVariantPrice[product.id]);
};
const setOldPrice = (product, el, price) => (el.innerHTML = `$${(Number(product.price.split("$")[1]) + Number(price.split("$")[1])).toFixed(2)}`);
const setNewPrice = (product, el, price) => {
  if (Number(price.split("$")[1]) === 0) {
    el.innerHTML = product.configs.newPrice.value;
    if (product.configs.newPrice.value === "FREE") el.style.color = "#D2232A";
    return;
  }
  el.style = "";
  const newPrice = product.configs.newPrice.value === "FREE" ? `$0.00` : product.configs.newPrice.value;
  el.innerHTML = `$${(Number(price.split("$")[1]) + Number(newPrice.split("$")[1])).toFixed(2)}`;
};

export { updateVariantValue, setOldPrice, setNewPrice };
