import createCart from "./modules/createCart.js";
import createProducts from "./modules/createProducts/createProducts.js";
import { setApiProducts } from "./modules/data.js";
import fetchProducts from "./modules/fetchProducts.js";
import handleError from "./modules/handleError.js";
import toggleLoading from "./modules/toggleLoading.js";

const stepCart = async ({ products }) => {
  try {
    toggleLoading();
    const apiData = await fetchProducts({ products });
    console.log(apiData);
    setApiProducts(apiData);
    if (apiData.some((product) => Object.keys(product.stock).every((key) => product.stock[key] <= 0))) throw new Error("Out of stock products.");
    const { productsWrapper, stepsWrapper, stepsText, stepsBack } = createCart();
    createProducts({ wrapper: productsWrapper, stepsWrapper, stepsText, stepsBack });
    toggleLoading();
  } catch (e) {
    console.error(e);
    handleError();
  }
};
window.stepCart = stepCart;
