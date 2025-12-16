import createProductCard from "./createProductCard.js";

const createStaticProduct = (product) => {
  const { card, image, name, desc, oldPrice, newPrice } = createProductCard(product);
  image.src = product.image;
  image.alt = product.name;
  name.innerHTML = product.name;
  desc.innerHTML = "test";
  oldPrice.innerHTML = product.price;
  newPrice.innerHTML = "TEST";
  return card;
};

export default createStaticProduct;
