import createCart from "./modules/createCart.js";
import createProducts from "./modules/createProducts/createProducts.js";
import { getBumpProduct, getBumpWrapper, getProductsWrapper, reset, setApiProducts, setBumpCoupon, setBumpProduct, setCouponCode } from "./modules/data.js";
import fetchProducts from "./modules/fetchProducts.js";
import handleError from "./modules/handleError.js";
import toggleLoading from "./modules/toggleLoading.js";

const stepCart = async ({ title, subTitle, products, country, bump, buttonOptions, couponCode }) => {
  try {
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        document.body.classList.remove("loading");
        document.body.style = "";
      }
    });
    toggleLoading();
    const [apiData, bumpData] = await Promise.all([fetchProducts({ products, country }), fetchProducts({ bump: bump?.product })]);

    const initDefaultProducts = () => {
      setCouponCode(couponCode);
      apiData.forEach((product) => (product.configs = products.find((el) => el.id == product.id)));
      setApiProducts(apiData);
      if (bump) setBumpCoupon(bump.couponCode);
    };

    const buttons = document.querySelectorAll("[cart-button]");
    if (bumpData && !Object.keys(bumpData.stock).every((key) => bumpData.stock[key] <= 0)) setBumpProduct(bumpData);
    if (apiData.some((product) => Object.keys(product.stock).every((key) => product.stock[key] <= 0))) throw new Error("Out of stock products.");
    let { closeCartButtons, cartWrapper, cartBackdrop, stepsWrapper, stepsBack, backToSteps, cartQuantity } = createCart({ title, subTitle, bumpTitle: bump?.title, country });
    const inlineProducts = document.querySelector("[inline-products]");

    if (inlineProducts) {
      stepsWrapper.remove();
      backToSteps.remove();
      stepsWrapper = inlineProducts;
      initDefaultProducts();
      createProducts({ stepsWrapper, stepsBack, backToSteps, cartQuantity });
      if (bump?.product && getBumpProduct()) createProducts({ cartQuantity, isBump: true });
    }
    [cartBackdrop, ...closeCartButtons].forEach((el) =>
      el.addEventListener("click", () => {
        cartWrapper.classList.remove("active");
        document.body.style = "";
      }),
    );
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        if (inlineProducts) {
          const invalidSelector = inlineProducts.querySelector("[invalid]");
          if (invalidSelector) {
            invalidSelector.classList.add("invalid");
            invalidSelector.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            return;
          }
        } else {
          reset();
          backToSteps.classList.remove("active");
          stepsBack.classList.remove("active");
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
          } else initDefaultProducts();
          createProducts({ stepsWrapper, stepsBack, backToSteps, cartQuantity });
          if (bump?.product && getBumpProduct()) createProducts({ cartQuantity, isBump: true });
        }
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
window.stepCart = stepCart;
export default stepCart;
