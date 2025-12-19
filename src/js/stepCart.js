import createCart from "./modules/createCart.js";
import createProducts from "./modules/createProducts/createProducts.js";
import { setApiProducts, setBumpProduct } from "./modules/data.js";
import fetchProducts from "./modules/fetchProducts.js";
import handleError from "./modules/handleError.js";
import toggleLoading from "./modules/toggleLoading.js";

const stepCart = async ({ products, bump, couponCode }) => {
  try {
    toggleLoading();
    const [apiData, bumpData] = await Promise.all([fetchProducts({ products }), fetchProducts({ bump: bump?.product })]);
    setApiProducts(apiData);
    setBumpProduct(bumpData);
    if (apiData.some((product) => Object.keys(product.stock).every((key) => product.stock[key] <= 0))) throw new Error("Out of stock products.");
    const { stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity } = createCart();
    createProducts({ stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity });
    if (bump?.product) createProducts({ cartQuantity, isBump: true });
    toggleLoading();
  } catch (e) {
    console.error(e);
    handleError();
  }
};
window.stepCart = stepCart;
