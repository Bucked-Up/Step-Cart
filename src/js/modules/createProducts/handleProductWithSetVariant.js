import { addRegularProduct } from "../data.js";

const handleProductWithSetVariant = ({ product }) => {
  const value = product.options[0].values.find((value) => value.id == product.configs.variant);
  addRegularProduct({ product, choice: `${product.options[0].id}-${value.id}` });
  return value;
};

export default handleProductWithSetVariant;
