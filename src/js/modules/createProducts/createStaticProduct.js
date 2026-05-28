import { addStaticProduct, getTotalValue, removeProduct, setTotalValue } from "../data.js";
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
  const actualQuantity = prodQuantity || product.configs.quantity || 1;
  if (product.configs.desc) desc.innerHTML = product.configs.desc;
  handleRecurringDescription({ product, desc });
  if (actualQuantity > 1) quantity.innerHTML = actualQuantity;
  else quantity.style.display = "none";
  if (isDiscounted && !product.configs.notDiscounted) {
    oldPrice.innerHTML = `$${(Number(product.price.split("$")[1]) * actualQuantity).toFixed(2)}`;
    newPrice.innerHTML = product.configs.newPrice.value;
    if (product.configs.newPrice.value !== "FREE" && !isBump) setTotalValue(getTotalValue() + Number(product.configs.newPrice.value.split("$")[1]));
    else if (product.configs.newPrice.value == "FREE") newPrice.style.color = "#D2232A";
  } else {
    if (!isBump) setTotalValue(getTotalValue() + Number(product.price.split("$")[1]) * actualQuantity);
    newPrice.innerHTML = `$${(Number(product.price.split("$")[1]) * actualQuantity).toFixed(2)}`;
  }
  return card;
};

export default createStaticProduct;
