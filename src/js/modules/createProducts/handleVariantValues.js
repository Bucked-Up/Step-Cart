import { getTotalValue, setTotalValue } from "../data.js";

let currentVariantPrice = {};

const updateVariantValue = (product, variant, qty = 1) => {
  if (!currentVariantPrice[product.id]) currentVariantPrice[product.id] = 0;
  setTotalValue(getTotalValue() - currentVariantPrice[product.id]);
  currentVariantPrice[product.id] = Number(variant.price.split("$")[1]) * qty;
  setTotalValue(getTotalValue() + currentVariantPrice[product.id]);
};
const setOldPrice = (product, el, price, qty = 1) => (el.innerHTML = `$${((Number(product.price.split("$")[1]) + Number(price.split("$")[1])) * qty).toFixed(2)}`);
// newPrice.value is the line total (as on static cards), so only the variant surcharge scales with qty.
const setNewPrice = (product, el, price, qty = 1) => {
  if (Number(price.split("$")[1]) === 0) {
    el.innerHTML = product.configs.newPrice.value;
    if (product.configs.newPrice.value === "FREE") el.style.color = "#D2232A";
    return;
  }
  el.style = "";
  const newPrice = product.configs.newPrice.value === "FREE" ? `$0.00` : product.configs.newPrice.value;
  el.innerHTML = `$${(Number(price.split("$")[1]) * qty + Number(newPrice.split("$")[1])).toFixed(2)}`;
};

export { updateVariantValue, setOldPrice, setNewPrice };
