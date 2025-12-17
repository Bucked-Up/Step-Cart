const getInputText = ({ name }) => {
  switch (name) {
    case "Small":
      return "S";
    case "Medium":
      return "M";
    case "Large":
      return "L";
    case "X-Large":
      return "XL";
    default:
      return name;
  }
};

const createSizeSelectors = ({ product }) => {
  const values = product.options[1].values;
  const inputs = [];
  const labels = [];
  values.forEach((value) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const mainText = document.createElement("span");
    const priceUpText = document.createElement("span");
    const [mainTextText, priceUpTextText] = value.name.split("(");
    mainText.innerHTML = getInputText({ name: mainTextText.trim() });
    priceUpText.innerHTML = "(" + priceUpTextText?.trim();
    priceUpText.classList.add("price-up-text");
    label.classList.add("sizes-selector");
    label.for = `${product.id}-${product.options[1].id}-${value.id}`;
    input.id = `${product.id}-${product.options[1].id}-${value.id}`;
    input.value = value.id;
    input.name = `${product.id}-${product.options[1].id}`;
    input.type = "radio";
    label.appendChild(input);
    label.appendChild(mainText);
    if (priceUpTextText) label.appendChild(priceUpText);
    inputs.push(input);
    labels.push(label);
  });
  return [labels, inputs];
};

export default createSizeSelectors;
