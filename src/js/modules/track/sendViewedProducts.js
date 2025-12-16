const sendViewedProducts = (data) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "Viewed Products",
    products: data.map((data) => ({ product_id: data.product.id, name: data.product.name, price: data.product.price.split("$")[1], currency: data.product.price.split("$")[0].trim() || "USD" })),
  });
};

export default sendViewedProducts;
