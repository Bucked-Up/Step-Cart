const isDependent = (product) => JSON.parse(Object.keys(product.stock)[0]).length > 1;

export default isDependent;
