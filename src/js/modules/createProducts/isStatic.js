const isStatic = (product) => product.options.length === 0 || product.options[0].type === "static";

export default isStatic;
