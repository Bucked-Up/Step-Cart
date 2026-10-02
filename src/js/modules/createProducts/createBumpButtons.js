import { applyBumpCoupon, getApiProducts, getBumpWrapper, getGlobalQuantity, getProductsWrapper, getTotalValue, revertBumpCoupon, setGlobalQuantity, setTotalListener, setTotalValue } from "../data.js";
import getPrice from "../utils/getPrice.js";

const createBumpButtons = ({ product, card, progress }) => {
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

  // Optional top progress bar for this bump — a call-to-action that fills to a green
  // "unlocked" state once the bump is added. One bar per cart: a product's dynamicQtty bar
  // (wired earlier, which unhides it) takes precedence, so only claim the bar when hidden.
  const progressEl = document.querySelector("[cart-progress]");
  const useProgress = progress && progressEl && progressEl.style.display === "none";
  // renderProgress is driven by the add/remove handlers (binary mode). In goal mode the bar
  // tracks the live cart total instead, so this stays a no-op and a total listener does the work.
  let renderProgress = () => {};
  if (useProgress) {
    const fillEl = progressEl.querySelector("[cart-progress-fill]");
    const textEl = progressEl.querySelector("[cart-progress-text]");
    const addedEl = progressEl.querySelector("[cart-progress-added]");
    const perks = [].concat(progress.added || []);
    const renderAdded = (met) => {
      if (addedEl) addedEl.innerHTML = met ? perks.map((name) => `<p><b>${name}</b> added</p>`).join("") : "";
    };
    if (progress.goal != null) {
      // Goal mode: fill tracks total toward a dollar threshold (e.g. free shipping). The
      // {remaining} token in `text` is replaced with the amount still needed.
      const sub = (t, remaining) => (t || "").split("{remaining}").join(`$${remaining.toFixed(2)}`);
      const renderGoal = (totalValue) => {
        progressEl.style.display = "";
        const remaining = Math.max(0, progress.goal - totalValue);
        const met = totalValue >= progress.goal;
        fillEl.style.width = `${Math.min(100, (totalValue / progress.goal) * 100)}%`;
        textEl.innerHTML = met ? progress.addedText || sub(progress.text, remaining) : sub(progress.text, remaining);
        progressEl.classList.toggle("cart__progress--met", met);
        renderAdded(met);
      };
      renderGoal(getTotalValue());
      setTotalListener(renderGoal);
    } else {
      renderProgress = (added) => {
        progressEl.style.display = "";
        fillEl.style.width = added ? "100%" : "0%";
        textEl.innerHTML = (added ? progress.addedText : progress.text) || progress.text || "";
        progressEl.classList.toggle("cart__progress--met", added);
        renderAdded(added);
      };
      renderProgress(false);
    }
  }

  let oldProductsValue = 0;
  const products = getApiProducts();
  const productsPrices = [];
  if (product.configs.changePrices) {
    product.configs.changePrices.forEach((newPrice) => {
      const product = products.find((prod) => prod.id == newPrice.id);
      oldProductsValue += getPrice(product.price);
    });
  }
  addButton.addEventListener("click", () => {
    applyBumpCoupon();
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
        const productPrice = getPrice(product.configs.newPrice?.value || product.price);
        productsPrices.push({ id: product.id, price: productPrice });
        newTotal = newTotal - (newPrice.newPrice == "FREE" ? productPrice : productPrice - getPrice(newPrice.newPrice));
      });
    }
    setTotalValue(newTotal);
    setGlobalQuantity(getGlobalQuantity() + 1);
    renderProgress(true);
  });
  removeButton.addEventListener("click", () => {
    revertBumpCoupon();
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
    renderProgress(false);
  });
  return [addButton, removeButton];
};

export default createBumpButtons;
