let apiProducts = [];
let products = [];
let globalQuantity = 0;
let totalValue = 0;
let subtotal = 0;
let bumpProduct;
let productsWrapper;
let bumpWrapper;
let couponCode;
let baseCoupon;
let bumpCode;
let bumpApplied = false;

const reset = () => {
  console.log("Resetting", totalValue);
  products = [];
  setGlobalQuantity(0);
  setTotalValue(0);
  setSubtotal(0);
  bumpApplied = false;
  console.log("Resetted", totalValue);
};
const getProductConfigs = (id) => apiProducts.find((prod) => prod.id == id)?.configs;
// couponCode is the code sent at checkout. baseCoupon is what applies while no bump is
// added; bumpCode is what applies while one is. Both sides can be re-set at any time (a
// dynamicQtty stepper does exactly that), so the active code is resolved on every write
// instead of being snapshotted by the bump buttons.
const setCouponCode = (code) => {
  baseCoupon = code;
  if (!bumpApplied) couponCode = code;
};
const getCouponCode = () => couponCode;
const getBaseCoupon = () => baseCoupon;
const setBumpCoupon = (code) => {
  bumpCode = code;
  if (bumpApplied) couponCode = code;
};
const getBumpCoupon = () => bumpCode;
const applyBumpCoupon = () => {
  bumpApplied = true;
  couponCode = bumpCode;
};
const revertBumpCoupon = () => {
  bumpApplied = false;
  couponCode = baseCoupon;
};
const isBumpCouponApplied = () => bumpApplied;
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
const setProductQuantity = ({ id, quantity }) => {
  const entry = products.find((el) => el.id === id);
  if (entry) entry.quantity = quantity;
};
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
  refreshDiscount();
};
const getSubtotal = () => subtotal;
const setSubtotal = (value) => {
  subtotal = value;
  const el = document.querySelector("[cart-subtotal]");
  if (el) el.innerHTML = `$${value.toFixed(2)}`;
  refreshDiscount();
};
const refreshDiscount = () => {
  const el = document.querySelector("[cart-discount]");
  if (!el) return;
  const savings = Math.max(0, subtotal - totalValue);
  el.innerHTML = `-$${savings.toFixed(2)}`;
};
const setBumpProduct = (product) => (bumpProduct = product);
const getBumpProduct = () => bumpProduct;
export { getProductConfigs, setBumpCoupon, getBumpCoupon, applyBumpCoupon, revertBumpCoupon, isBumpCouponApplied, setCouponCode, getCouponCode, getBaseCoupon, reset, removeProduct, setProductsWrapper, setBumpWrapper, getProductsWrapper, getBumpWrapper, getApiProducts, setApiProducts, getGlobalQuantity, setGlobalQuantity, getProducts, addStaticProduct, addRegularProduct, setProductQuantity, getTotalValue, setTotalValue, getSubtotal, setSubtotal, setBumpProduct, getBumpProduct };
