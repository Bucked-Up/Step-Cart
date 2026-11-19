import { getCouponCode, getProductConfigs, getProducts } from "./data.js";
import toggleLoading from "./toggleLoading.js";
import getCookie from "./track/getCookie.js";
import sendVibeLead from "./track/sendVibeLead.js";

const handlePurchase = ({ country, urlParams }) => {
  toggleLoading();
  const products = getProducts();
  const rlAnonId = getCookie("rl_anonymous_id");
  if (rlAnonId) urlParams.set("rl_anonymous_id", rlAnonId);
  urlParams.set("cc", getCouponCode());
  urlParams.set("source_url", location.href.split("?")[0]);
  let string = "";
  let i = 0;
  const appendEntry = (product, quantity, recurringValue) => {
    string = string + `&products[${i}][id]=${product.id}&products[${i}][quantity]=${quantity}`;
    if (recurringValue) {
      string = string + `&products[${i}][product_recurring_id]=${recurringValue}`;
    }
    if (product.type !== "static") {
      const options = product.choice.split("/") || product.choice;
      options.forEach((optionValue) => {
        const [option, value] = optionValue.split("-");
        string = string + `&products[${i}][options][${option}]=${value}`;
      });
    }
    i++;
  };
  // Units of a variant step are separate lines; units that share a choice ship as one line.
  const lines = [];
  products.forEach((product) => {
    const same = lines.find((line) => line.id === product.id && line.type === product.type && line.choice === product.choice);
    if (same) same.quantity += product.quantity;
    else lines.push({ ...product });
  });
  // Only the first unit of a product is the recurring one, whatever the line split.
  const recurringIds = new Set();
  lines.forEach((product) => {
    const recurring = getProductConfigs(product.id)?.recurring;
    if (recurring && !recurringIds.has(product.id)) {
      recurringIds.add(product.id);
      const selectedValue =
        recurring.period ??
        document.querySelector(`[name="${product.id}-recurring"]:checked`)?.value;
      appendEntry(product, 1, selectedValue);
      if (product.quantity > 1) appendEntry(product, product.quantity - 1, null);
    } else {
      appendEntry(product, product.quantity, null);
    }
  });
  sendVibeLead();
  let url = "https://funnels.buckedup.com/cart/add?";
  if (country === "us-main") url = "https://buckedup.com/cart/add?";
  else if (country === "uk") url = "https://www.buckedup.co.uk/cart/add?";
  else if (country && country !== "us") url = "https://${country}.buckedup.com/cart/add?";
  window.location.href = `${url}${urlParams}${string}&clear=true`;
};

export default handlePurchase;
