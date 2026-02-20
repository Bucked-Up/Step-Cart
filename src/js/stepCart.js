import createCart from "./modules/createCart.js";
import createProducts from "./modules/createProducts/createProducts.js";
import { getBumpProduct, getBumpWrapper, getProductsWrapper, reset, setApiProducts, setBumpCoupon, setBumpProduct, setCouponCode } from "./modules/data.js";
import fetchProducts from "./modules/fetchProducts.js";
import handleError from "./modules/handleError.js";
import toggleLoading from "./modules/toggleLoading.js";

const stepCart = async ({ products, country, bump, buttonOptions, couponCode }) => {
  try {
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        document.body.classList.remove("loading");
        document.body.style = "";
      }
    });
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.size == 0) urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
    toggleLoading();
    const [apiData, bumpData] = await Promise.all([fetchProducts({ products, country }), fetchProducts({ bump: bump?.product })]);
    const buttons = document.querySelectorAll("[cart-button]");
    if (bumpData && !Object.keys(bumpData.stock).every((key) => bumpData.stock[key] <= 0)) setBumpProduct(bumpData);
    if (apiData.some((product) => Object.keys(product.stock).every((key) => product.stock[key] <= 0))) throw new Error("Out of stock products.");
    const { closeCartButtons, cartWrapper, cartBackdrop, stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity } = createCart({ bumpTitle: bump?.title, country, urlParams });
    [cartBackdrop, ...closeCartButtons].forEach((el) =>
      el.addEventListener("click", () => {
        cartWrapper.classList.remove("active");
        document.body.style = "";
      }),
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
        if (buttonOptions && buttonOptions[button.id]) {
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
        if (bump?.product && getBumpProduct()) createProducts({ cartQuantity, isBump: true });
        cartWrapper.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    });
    toggleLoading();
  } catch (e) {
    console.error(e);
    handleError();
  }
};
export default stepCart;
window.stepCart = stepCart;
