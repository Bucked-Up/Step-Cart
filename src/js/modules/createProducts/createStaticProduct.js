import { addStaticProduct, getGlobalQuantity, getSubtotal, getTotalValue, removeProduct, setGlobalQuantity, setProductQuantity, setSubtotal, setTotalValue } from "../data.js";
import getPrice from "../utils/getPrice.js";
import createBumpButtons from "./createBumpButtons.js";
import createProductCard from "./createProductCard.js";
import handleRecurringDescription from "./handleRecurringDescription.js";

const createStaticProduct = ({ product, isDiscounted = true, prodQuantity, isBump }) => {
  const { card, image, name, desc, oldPrice, newPrice, quantity } = createProductCard(product);
  if (!product.configs.newPrice) isDiscounted = false;
  image.src = product.image;
  image.alt = product.name;
  name.innerHTML = product.configs.name || product.name;
  if (isBump) {
    const [addButton, removeButton] = createBumpButtons({ product, card });
    addButton.addEventListener("click", () => {
      addStaticProduct({ product });
    });
    removeButton.addEventListener("click", () => {
      removeProduct({ product });
    });
  }
  const initialQty = prodQuantity || product.configs.quantity || 1;
  if (product.configs.desc) desc.innerHTML = product.configs.desc;
  handleRecurringDescription({ product, desc });

  const basePrice = Number(product.price.split("$")[1]);
  const showDiscounted = isDiscounted && !product.configs.notDiscounted;
  const isFree = showDiscounted && product.configs.newPrice?.value === "FREE";
  if (isFree) newPrice.style.color = "#D2232A";

  const contributionFor = (qty) => {
    if (qty <= 0 || isBump) return 0;
    if (showDiscounted && !isFree) return getPrice(product.configs.newPrice.value);
    if (isFree) return 0;
    return basePrice * qty;
  };
  const subtotalFor = (qty) => {
    if (qty <= 0 || isBump) return 0;
    return basePrice * qty;
  };

  const renderQty = (qty) => {
    const displayQty = Math.max(qty, 1);
    if (qty > 1) {
      quantity.innerHTML = qty;
      quantity.style.display = "";
    } else {
      quantity.innerHTML = displayQty;
      quantity.style.display = "none";
    }
    if (showDiscounted) {
      oldPrice.innerHTML = `$${(basePrice * displayQty).toFixed(2)}`;
      newPrice.innerHTML = product.configs.newPrice.value;
    } else {
      newPrice.innerHTML = `$${(basePrice * displayQty).toFixed(2)}`;
    }
  };

  renderQty(initialQty);
  let currentQty = initialQty;
  if (!isBump) {
    setTotalValue(getTotalValue() + contributionFor(initialQty));
    setSubtotal(getSubtotal() + subtotalFor(initialQty));
  }

  const recomputeCard = (newQty) => {
    if (newQty === currentQty) return;
    const previousContribution = contributionFor(currentQty);
    const newContribution = contributionFor(newQty);
    const previousSubtotal = subtotalFor(currentQty);
    const newSubtotal = subtotalFor(newQty);
    const previousQty = currentQty;
    currentQty = newQty;
    renderQty(newQty);
    if (previousQty > 0 && newQty > 0) {
      setProductQuantity({ id: product.id, quantity: newQty });
    }
    if (!isBump) {
      const contributionDelta = newContribution - previousContribution;
      if (contributionDelta !== 0) setTotalValue(getTotalValue() + contributionDelta);
      const subtotalDelta = newSubtotal - previousSubtotal;
      if (subtotalDelta !== 0) setSubtotal(getSubtotal() + subtotalDelta);
      const qtyDelta = newQty - previousQty;
      if (qtyDelta !== 0) setGlobalQuantity(getGlobalQuantity() + qtyDelta);
    }
  };

  return { card, recomputeCard, contributionFor, subtotalFor, initialQty };
};

export default createStaticProduct;
