import createCart from "./modules/createCart.js";
import createProducts from "./modules/createProducts/createProducts.js";
import { getBumpWrapper, getProductsWrapper, reset, setApiProducts, setBumpCoupon, setBumpProduct, setCouponCode } from "./modules/data.js";
import fetchProducts from "./modules/fetchProducts.js";
import handleError from "./modules/handleError.js";
import toggleLoading from "./modules/toggleLoading.js";

const stepCart = async ({ products, bump, buttonOptions, couponCode }) => {
  try {
    toggleLoading();
    const [apiData, bumpData] = await Promise.all([fetchProducts({ products }), fetchProducts({ bump: bump?.product })]);
    const buttons = document.querySelectorAll("[cart-button]");
    setBumpProduct(bumpData);
    if (apiData.some((product) => Object.keys(product.stock).every((key) => product.stock[key] <= 0))) throw new Error("Out of stock products.");
    const { cart, closeCartButtons, cartWrapper, cartBackdrop, stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity } = createCart();
    [cartBackdrop, ...closeCartButtons].forEach((el) =>
      el.addEventListener("click", () => {
        cartWrapper.classList.remove("active");
      })
    );
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        reset();
        stepsBack.classList.remove("active");
        backToSteps.classList.remove("active");
        stepsWrapper.classList.remove("active");
        stepsWrapper.querySelectorAll(".cart__steps__step").forEach((el) => el.remove());
        getProductsWrapper().innerHTML = "";
        getBumpWrapper()
          .querySelectorAll(".cart__product")
          .forEach((el) => el.remove());
        if (buttonOptions[button.id]) {
          const products = buttonOptions[button.id].products;
          const data = apiData.filter((el) => products.find((toFind) => toFind.id == el.id));
          data.forEach((product) => (product.configs = products.find((el) => el.id == product.id)));
          setApiProducts(data);
          setCouponCode(buttonOptions[button.id].couponCode);
          if (bump) {
            if (buttonOptions[button.id].bumpCoupon) setBumpCoupon(buttonOptions[button.id].bumpCoupon);
            else setBumpCoupon(bump.couponCode);
          }
          if (buttonOptions[button.id].bumpCoupon) setBumpCoupon(buttonOptions[button.id].bumpCoupon);
        } else {
          setCouponCode(couponCode);
          apiData.forEach((product) => (product.configs = products.find((el) => el.id == product.id)));
          setApiProducts(apiData);
          if (bump) setBumpCoupon(bump.couponCode);
        }
        createProducts({ stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity });
        if (bump?.product) createProducts({ cartQuantity, isBump: true });
        cartWrapper.classList.add("active");
      });
    });
    toggleLoading();
  } catch (e) {
    console.error(e);
    handleError();
  }
};
window.stepCart = stepCart;
