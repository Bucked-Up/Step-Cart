import { setBumpWrapper, setProductsWrapper } from "./data.js";
import handlePurchase from "./handlePurchase.js";

const createCart = ({ bumpTitle, country, urlParams, showFullPricing }) => {
  const cartWrapper = document.createElement("div");
  const cartBackdrop = document.createElement("div");
  cartWrapper.classList.add("cart-wrapper");
  cartBackdrop.classList.add("cart-backdrop");
  const cart = document.createElement("div");
  cart.classList.add("cart");
  cart.innerHTML =
    '<div class=cart__steps cart-steps><div class=cart__steps__head><div><button type=button step-back><svg viewBox="0 0 640 640"xmlns=http://www.w3.org/2000/svg><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/></svg></button><p steps-text>Step 1</div><button type=button close-cart><svg viewBox="0 0 640 640"xmlns=http://www.w3.org/2000/svg><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z"/></svg></button></div></div><div class=cart__head><div><button type=button back-to-steps><svg viewBox="0 0 640 640"xmlns=http://www.w3.org/2000/svg><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/></svg></button><p>Your Cart (<span cart-qtty>0</span>)</div><button type=button close-cart><svg viewBox="0 0 640 640"xmlns=http://www.w3.org/2000/svg><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z"/></svg></button></div><div class=cart__progress cart-progress style=display:none><p class=cart__progress__text cart-progress-text></p><div class=cart__progress__track><div class=cart__progress__fill cart-progress-fill></div></div></div><div class=cart__products-wrapper><div class=cart__products cart-products></div><div class=cart__bumps cart-bumps><p class="cart__bumps__title">You may also like:</p></div></div><div class=cart__footer><div class=cart__full-pricing cart-full-pricing style=display:none><div class=cart__full-pricing__row><p>Subtotal<p cart-subtotal>$0.00</div><div class="cart__full-pricing__row cart__full-pricing__row--discount"><p>Discount<p cart-discount>-$0.00</div></div><div class=cart__total><p class=cart__total__total>Total<p class=cart__total__value cart-total>$0.00</div><button type=button purchase-button>GO TO CHECKOUT</button></div>';
  document.body.appendChild(cartWrapper);
  cartWrapper.appendChild(cartBackdrop);
  cartWrapper.appendChild(cart);
  const bumpTitleEl = cart.querySelector(".cart__bumps__title");
  if (bumpTitle) bumpTitleEl.innerHTML = bumpTitle;
  if (showFullPricing) cart.querySelector("[cart-full-pricing]").style.display = "";
  const cartQuantity = cart.querySelector("[cart-qtty]");
  const closeCartButtons = cart.querySelectorAll("[close-cart]");
  const productsWrapper = cart.querySelector("[cart-products]");
  const bumpWrapper = cart.querySelector("[cart-bumps]");
  const purchaseButton = document.querySelector("[purchase-button]");
  purchaseButton.addEventListener("click", () => handlePurchase({ country, urlParams }));
  setProductsWrapper(productsWrapper);
  setBumpWrapper(bumpWrapper);
  const backToSteps = cart.querySelector("[back-to-steps]");

  const stepsWrapper = cart.querySelector("[cart-steps]");
  const stepsBack = cart.querySelector("[step-back]");
  const stepsText = cart.querySelector("[steps-text]");
  return { purchaseButton, closeCartButtons, cartWrapper, cartBackdrop, stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity };
};

export default createCart;
