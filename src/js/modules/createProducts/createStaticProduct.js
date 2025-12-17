import createProductCard from "./createProductCard.js";

const createStaticProduct = (product) => {
  const { card, image, name, desc, oldPrice, newPrice } = createProductCard(product);
  image.src = product.image;
  image.alt = product.name;
  name.innerHTML = product.name;
  desc.innerHTML = product.configs.desc;
  oldPrice.innerHTML = product.price;
  newPrice.innerHTML = product.configs.newPrice.value;
  return card;
};

export default createStaticProduct;
