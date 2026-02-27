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
  products.forEach((product, i) => {
    const recurring = getProductConfigs(product.id)?.recurring
    string = string + `&products[${i}][id]=${product.id}&products[${i}][quantity]=${product.quantity}`;
    if(recurring){
      const selectedValue = document.querySelector(`[name="${product.id}-recurring"]:checked`).value;
      string = string + `&products[${i}][product_recurring_id]=${selectedValue}`
    }
    if (product.type === "static") return;

    const options = product.choice.split("/") || product.choice;
    options.forEach((optionValue) => {
      const [option, value] = optionValue.split("-");
      string = string + `&products[${i}][options][${option}]=${value}`;
    });
  });
  sendVibeLead();
  let url = "https://funnels.buckedup.com/cart/add?";
  if (country === "us-main") url = "https://buckedup.com/cart/add?";
  else if (country === "uk") url = "https://www.buckedup.co.uk/cart/add?";
  else if (country && country !== "us") url = "https://${country}.buckedup.com/cart/add?";
  window.location.href = `${url}${urlParams}${string}&clear=true`;
};

export default handlePurchase;
