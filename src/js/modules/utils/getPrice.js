const getPrice = (price) => price == "FREE" ? 0 : Number(price.split("$")[1]);

export default getPrice;
