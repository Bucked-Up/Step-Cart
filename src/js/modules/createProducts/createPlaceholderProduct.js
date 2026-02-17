const createPlaceholderProduct = ({ product }) => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("cart__placeholder-product");
  wrapper.innerHTML = `
    <div class="cart__steps__step__title-price-wrapper">
      <p class="cart__steps__step__title">${product.name}</p>
      <div class="cart__steps__step__title-price-wrapper__prices-wrapper">
        <p class="cart__steps__step__title-price-wrapper__old-price">${product.configs?.newPrice?.value ? product.price : ""}</p>
        <p class="cart__steps__step__title-price-wrapper__new-price">${product.configs?.newPrice?.value ? product.configs?.newPrice?.value : product.price}</p>
      </div>
    </div>
    <div class="cart__placeholder-product__card">
      <div class="cart__placeholder-product__card__image"><img src="${product.image}"></div>
      <p>${product.configs.desc}</p>
    </div>
  `;
  return wrapper;
};

export default createPlaceholderProduct;
