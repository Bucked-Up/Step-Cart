let apiProducts = [];
let products = [];
let globalQuantity = 0;
let totalValue = 0;
const setApiProducts = (products) => {
  apiProducts = products;
};
const getApiProducts = () => apiProducts;
const setGlobalQuantity = (quantity) => (globalQuantity = quantity);
const getGlobalQuantity = () => globalQuantity;
const addStaticProduct = ({ product, quantity = 1 }) => products.push({ id: product.id, type: "static", quantity });
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
  totalValue = value;
  document.querySelector("[cart-total]").innerHTML = `$${value.toFixed(2)}`;
};

export { getApiProducts, setApiProducts, getGlobalQuantity, setGlobalQuantity, getProducts, addStaticProduct, addRegularProduct, getTotalValue, setTotalValue };
