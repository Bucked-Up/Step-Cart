import { getCouponCode, getProducts } from "./data.js";
import toggleLoading from "./toggleLoading.js";
import getCookie from "./track/getCookie.js";
import sendVibeLead from "./track/sendVibeLead.js";

const handlePurchase = () => {
  toggleLoading();
  const products = getProducts();
  const urlParams = new URLSearchParams(window.location.search);
  const rlAnonId = getCookie("rl_anonymous_id");
  if (rlAnonId) urlParams.set("rl_anonymous_id", rlAnonId);
  urlParams.set("cc", getCouponCode());
  urlParams.set("source_url", location.href.split("?")[0]);
  let string = "";
  products.forEach((product, i) => {
    string = string + `&products[${i}][id]=${product.id}&products[${i}][quantity]=${product.quantity}`;

    if (product.type === "static") return;

    const options = product.choice.split("/") || product.choice;
    options.forEach((optionValue) => {
      const [option, value] = optionValue.split("-");
      string = string + `&products[${i}][options][${option}]=${value}`;
    });
  });
  sendVibeLead();
  window.location.href = `https://funnels.buckedup.com/cart/add?${urlParams}${string}&clear=true`;
};

export default handlePurchase;
