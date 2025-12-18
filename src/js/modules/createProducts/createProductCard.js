const createProductCard = (product) => {
  const card = document.createElement("div");
  const imageWrapper = document.createElement("div");
  const image = document.createElement("img");
  const texts = document.createElement("div");
  const name = document.createElement("p");
  const desc = document.createElement("p");
  const prices = document.createElement("div");
  const oldPrice = document.createElement("p");
  const newPrice = document.createElement("p");
  const quantity = document.createElement("span");

  card.classList.add("cart__product");
  imageWrapper.classList.add("cart__product__image");
  texts.classList.add("cart__product__texts");
  name.classList.add("cart__product__name");
  desc.classList.add("cart__product__desc");
  prices.classList.add("cart__product__prices");
  oldPrice.classList.add("cart__product__old-price");
  newPrice.classList.add("cart__product__new-price");
  quantity.classList.add("cart__product__quantity");

  card.appendChild(imageWrapper);
  card.appendChild(texts);
  card.appendChild(prices);
  imageWrapper.appendChild(image);
  if (product.configs.quantity) imageWrapper.appendChild(quantity);
  texts.appendChild(name);
  texts.appendChild(desc);
  prices.appendChild(oldPrice);
  prices.appendChild(newPrice);

  return { card, image, name, desc, oldPrice, newPrice, quantity };
};

export default createProductCard;
