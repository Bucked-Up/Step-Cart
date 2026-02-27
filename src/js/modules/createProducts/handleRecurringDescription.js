import getPrice from "../utils/getPrice.js";

const handleRecurringDescription = ({ product, desc, value }) => {
  if (product.configs.recurring?.percent) {
    const recurringPeriod = document.querySelector(`[name="${product.id}-recurring"]:checked`).value;
    let productPrice = getPrice(product.price);
    if (value) productPrice += getPrice(value.price);
    const price = (productPrice - (product.configs.recurring.percent / 100) * productPrice).toFixed(2);
    desc.innerHTML = `${desc.innerHTML}<br><span class="cart__product__desc__recurring">Delivery every <b>${recurringPeriod}</b> Month${recurringPeriod > 1 ? "s" : ""} at <b>$${price}</b> (${product.configs.recurring.percent}% discount)</span>`;
  }
};

export default handleRecurringDescription;
