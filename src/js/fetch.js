const fetch = async ({ country, apiProducts }) => {
  if (!apiProducts) return;
  const ids = apiProducts.map((el) => el.id);
  const fetchApi = async (id) => {
    // let url = `https://funnels.buckedup.com/product/json/detail?product_id=${id}`;
    let url = `https://webhook-processor-production-4aa3.up.railway.app/webhook/dev?product_id=${id}`;
    if (country === "us-main") url = `https://www.buckedup.com/product/json/detail?product_id=${id}`;
    else if (country === "uk") url = `https://www.buckedup.co.uk/product/json/detail?product_id=${id}`;
    else if (country && country !== "us") url = `https://${country}.buckedup.com/product/json/detail?product_id=${id}`;
    // if (country && country === "us-main") url = `https://webhook-processor-production-4aa3.up.railway.app/webhook/dev-us-main?product_id=${id}`
    try {
      const response = await fetch(url);
      if (response.status === 404) throw new Error(`Product ${id} Not Found.`);
      if (response.status == 500 || response.status == 400) throw new Error("Sorry, there was a problem.");
      const data = await response.json();
      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  };
  const data = await Promise.all(ids.map(fetchApi));
  sendViewedProducts(data);
  data.forEach((item) => {
    if (Object.keys(item.product.stock).every((key) => item.product.stock[key] <= 0)) console.error(`${item.product.name} Out of stock.`);
  });
  return data.map((data) => data.product);
};