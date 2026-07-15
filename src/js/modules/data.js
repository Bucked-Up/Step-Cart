let apiProducts = [];
let products = [];
let globalQuantity = 0;
let totalValue = 0;
let bumpProduct;
let productsWrapper;
let bumpWrapper;
let couponCode;
let bumpCode;

const reset = () => {
  console.log("Resetting", totalValue);
  products = [];
  setGlobalQuantity(0);
  setTotalValue(0);
  console.log("Resetted", totalValue);
};
const getProductConfigs = (id) => apiProducts.find((prod) => prod.id == id)?.configs;
const setCouponCode = (code) => (couponCode = code);
const getCouponCode = () => couponCode;
const setBumpCoupon = (code) => (bumpCode = code);
const getBumpCoupon = () => bumpCode;
const setProductsWrapper = (wrapper) => (productsWrapper = wrapper);
const setBumpWrapper = (wrapper) => (bumpWrapper = wrapper);
const getProductsWrapper = () => productsWrapper;
const getBumpWrapper = () => bumpWrapper;
const setApiProducts = (products) => {
  apiProducts = products;
};
const getApiProducts = () => apiProducts;
const setGlobalQuantity = (quantity) => {
  globalQuantity = quantity;
  document.querySelector("[cart-qtty]").innerHTML = quantity;
};
const getGlobalQuantity = () => globalQuantity;
const addStaticProduct = ({ product, quantity = 1 }) => products.push({ id: product.id, type: "static", quantity });
const removeProduct = ({ product }) => (products = products.filter((el) => el.id !== product.id));
const addRegularProduct = ({ product, choice, replace }) => {
  if (replace) {
    products = products.filter((el) => el.id !== product.id);
    products.push({ id: product.id, choice, quantity: 1, type: "regular" });
  } else {
    const currentProduct = products.find((el) => el.id === product.id && el.choice === choice);
    if (currentProduct) {
      currentProduct.quantity = currentProduct.quantity + 1;
    } else {
      products.push({ id: product.id, choice, quantity: 1, type: "regular" });
    }
  }
};
const getProducts = () => products;
const getTotalValue = () => totalValue;
const setTotalValue = (value) => {
  console.log("Global Total Value: ", value);
  totalValue = value;
  document.querySelector("[cart-total]").innerHTML = `$${value.toFixed(2)}`;
};
const setBumpProduct = (product) => (bumpProduct = product);
const getBumpProduct = () => bumpProduct;
export { getProductConfigs, setBumpCoupon, getBumpCoupon, setCouponCode, getCouponCode, reset, removeProduct, setProductsWrapper, setBumpWrapper, getProductsWrapper, getBumpWrapper, getApiProducts, setApiProducts, getGlobalQuantity, setGlobalQuantity, getProducts, addStaticProduct, addRegularProduct, getTotalValue, setTotalValue, setBumpProduct, getBumpProduct };
