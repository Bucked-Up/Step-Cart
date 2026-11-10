import createCart from "./modules/createCart.js";
import createProducts from "./modules/createProducts/createProducts.js";
import handleProductWithSetVariant from "./modules/createProducts/handleProductWithSetVariant.js";
import isStatic from "./modules/createProducts/isStatic.js";
import { addStaticProduct, getBumpProduct, getBumpWrapper, getProductsWrapper, reset, setApiProducts, setBumpCoupon, setBumpProduct, setCouponCode } from "./modules/data.js";
import fetchProducts from "./modules/fetchProducts.js";
import handleError from "./modules/handleError.js";
import handlePurchase from "./modules/handlePurchase.js";
import toggleLoading from "./modules/toggleLoading.js";
import applyVariantOrder from "./modules/utils/applyVariantOrder.js";

const stepCart = async ({ noCart, products, country, bump, buttonOptions, couponCode, showFullPricing, showBonus, showInitialLoading = true }) => {
  let openCart;
  let pendingButton = null;
  try {
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        document.body.classList.remove("loading");
        document.body.style = "";
      }
    });
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.size == 0) urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
    if (showInitialLoading) {
      toggleLoading();
    } else {
      // No start-up loader, so listen before the fetch: an early click is queued on the
      // button (last one wins) and replayed once the cart is ready.
      document.querySelectorAll("[cart-button]").forEach((button) =>
        button.addEventListener("click", () => {
          if (openCart) return openCart(button);
          if (pendingButton === button) return;
          pendingButton?.removeAttribute("aria-busy");
          pendingButton = button;
          button.setAttribute("aria-busy", "true");
        }),
      );
    }
    const [apiData, bumpData] = await Promise.all([fetchProducts({ products, country }), fetchProducts({ bump: bump?.product })]);

    const initDefaultProducts = () => {
      setCouponCode(couponCode);
      apiData.forEach((product) => {
        product.configs = products.find((el) => el.id == product.id);
        applyVariantOrder(product);
      });
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
      // The progress bar is a single shared element reused across cart opens — clear any
      // state left by a previous button's product dynamicQtty / bump progress config.
      const progressEl = document.querySelector("[cart-progress]");
      if (progressEl) {
        progressEl.style.display = "none";
        progressEl.classList.remove("cart__progress--met");
        progressEl.querySelector("[cart-progress-fill]").style.width = "0%";
        progressEl.querySelector("[cart-progress-text]").innerHTML = "";
        const addedEl = progressEl.querySelector("[cart-progress-added]");
        if (addedEl) addedEl.innerHTML = "";
      }
    };

    const applyButtonOptions = (button) => {
      const opts = buttonOptions[button.id];
      const data = apiData.filter((el) => opts.products.find((toFind) => toFind.id == el.id));
      data.forEach((product) => {
        product.configs = opts.products.find((el) => el.id == product.id);
        applyVariantOrder(product);
      });
      setApiProducts(data);
      setCouponCode(opts.couponCode || couponCode);
      if (bump) setBumpCoupon(opts.bumpCoupon || bump.couponCode);
      return data;
    };

    if (bumpData && !Object.keys(bumpData.stock).every((key) => bumpData.stock[key] <= 0)) setBumpProduct(bumpData);
    if (apiData.some((product) => Object.keys(product.stock).every((key) => product.stock[key] <= 0))) throw new Error("Out of stock products.");
    let { closeCartButtons, cartWrapper, cartBackdrop, stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity } = createCart({ bumpTitle: bump?.title, country, urlParams, showFullPricing });
    const inlineProducts = document.querySelector("[inline-products]");

    if (inlineProducts) {
      stepsWrapper.remove();
      backToSteps.remove();
      stepsWrapper = inlineProducts;
      initDefaultProducts();
      createProducts({ stepsWrapper, stepsBack, backToSteps, cartQuantity, showBonus, bump });
      if (bump?.product && getBumpProduct()) createProducts({ cartQuantity, isBump: true, bump });
    }
    [cartBackdrop, ...closeCartButtons].forEach((el) =>
      el.addEventListener("click", () => {
        cartWrapper.classList.remove("active");
        document.body.style = "";
      }),
    );
    openCart = (button) => {
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

        createProducts({ stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity, showBonus, bump });
        if (bump?.product && getBumpProduct() && !bump.isStep) createProducts({ cartQuantity, isBump: true, bump });
      }
      cartWrapper.classList.add("active");
      document.body.style.overflow = "hidden";
    };
    if (showInitialLoading) {
      document.querySelectorAll("[cart-button]").forEach((button) => button.addEventListener("click", () => openCart(button)));
      toggleLoading();
    }
  } catch (e) {
    pendingButton?.removeAttribute("aria-busy");
    console.error(e);
    handleError();
    return;
  }
  // Replayed outside the try so a failing click behaves like a click after ready.
  if (pendingButton) {
    const button = pendingButton;
    pendingButton = null;
    button.removeAttribute("aria-busy");
    openCart(button);
  }
};
export default stepCart;
window.stepCart = stepCart;
