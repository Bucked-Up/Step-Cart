import { getTotalValue, setTotalValue } from "../data.js";
import createProductCard from "./createProductCard.js";

const createStaticProduct = (product, isDiscounted = true, prodQuantity) => {
  const { card, image, name, desc, oldPrice, newPrice, quantity } = createProductCard(product);
  image.src = product.image;
  image.alt = product.name;
  name.innerHTML = product.name;
  const actualQuantity = prodQuantity || product.configs.quantity || 1;
  if (product.configs.desc) desc.innerHTML = product.configs.desc;
  if (actualQuantity > 1) quantity.innerHTML = actualQuantity;
  else quantity.style.display = "none";
  if (isDiscounted) {
    oldPrice.innerHTML = `$${Number(product.price.split("$")[1]) * actualQuantity}`;
    newPrice.innerHTML = product.configs.newPrice.value;
    if (product.configs.newPrice.value !== "FREE") setTotalValue(getTotalValue() + Number(product.configs.newPrice.value.split("$")[1]));
    else newPrice.style.color = "#0cb23b"
  } else {
    setTotalValue(getTotalValue() + Number(product.price.split("$")[1]) * actualQuantity);
    newPrice.innerHTML = Number(product.price.split("$")[1]) * actualQuantity;
  }
  return card;
};

export default createStaticProduct;
