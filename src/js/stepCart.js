import createCart from "./modules/createCart.js";
import createProducts from "./modules/createProducts/createProducts.js";
import handleProductWithSetVariant from "./modules/createProducts/handleProductWithSetVariant.js";
import isStatic from "./modules/createProducts/isStatic.js";
import { addStaticProduct, getBumpProduct, getBumpWrapper, getProductsWrapper, reset, setApiProducts, setBumpCoupon, setBumpProduct, setCouponCode } from "./modules/data.js";
import fetchProducts from "./modules/fetchProducts.js";
import handleError from "./modules/handleError.js";
import handlePurchase from "./modules/handlePurchase.js";
import toggleLoading from "./modules/toggleLoading.js";

const stepCart = async ({ noCart, products, country, bump, buttonOptions, couponCode, showFullPricing, showBonus }) => {
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

    const initDefaultProducts = () => {
      setCouponCode(couponCode);
      apiData.forEach((product) => (product.configs = products.find((el) => el.id == product.id)));
      setApiProducts(apiData);
      if (bump) setBumpCoupon(bump.couponCode);
    };

    const handleNoCart = (data) => {
      data.forEach((product) => {
        if (product.configs.variant) {
          handleProductWithSetVariant({ product });
        } else if (isStatic(product)) {
          addStaticProduct({ product, quantity: product.configs.quantity || 1 });
        }
      });
      handlePurchase({ country, urlParams });
    };

    const resetCartUI = () => {
      reset();
      backToSteps.classList.remove("active");
      stepsBack.classList.remove("active");
      stepsWrapper.classList.remove("active");
      stepsWrapper.querySelectorAll(".cart__steps__step").forEach((el) => el.remove());
      getProductsWrapper().innerHTML = "";
      getBumpWrapper()
        .querySelectorAll(".cart__product")
        .forEach((el) => el.remove());
    };

    const applyButtonOptions = (button) => {
      const opts = buttonOptions[button.id];
      const data = apiData.filter((el) => opts.products.find((toFind) => toFind.id == el.id));
      data.forEach((product) => (product.configs = opts.products.find((el) => el.id == product.id)));
      setApiProducts(data);
      setCouponCode(opts.couponCode);
      if (bump) setBumpCoupon(opts.bumpCoupon || bump.couponCode);
      return data;
    };

    const buttons = document.querySelectorAll("[cart-button]");
    if (bumpData && !Object.keys(bumpData.stock).every((key) => bumpData.stock[key] <= 0)) setBumpProduct(bumpData);
    if (apiData.some((product) => Object.keys(product.stock).every((key) => product.stock[key] <= 0))) throw new Error("Out of stock products.");
    let { closeCartButtons, cartWrapper, cartBackdrop, stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity } = createCart({ bumpTitle: bump?.title, country, urlParams, showFullPricing });
    const inlineProducts = document.querySelector("[inline-products]");

    if (inlineProducts) {
      stepsWrapper.remove();
      backToSteps.remove();
      stepsWrapper = inlineProducts;
      initDefaultProducts();
      createProducts({ stepsWrapper, stepsBack, backToSteps, cartQuantity, showBonus });
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
          resetCartUI();

          const hasButtonOptions = buttonOptions && buttonOptions[button.id];
          let data;
          if (hasButtonOptions) {
            data = applyButtonOptions(button);
          } else {
            initDefaultProducts();
            data = apiData;
          }

          const skipCart = noCart || (hasButtonOptions && buttonOptions[button.id].noCart);
          if (skipCart) {
            handleNoCart(data);
            return;
          }

          createProducts({ stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity, showBonus });
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
export default stepCart;
window.stepCart = stepCart;
