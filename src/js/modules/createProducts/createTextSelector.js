import isDependent from "./isDepentent.js";

const createTextSelector = ({ product, image }) => {
  let hasChecked = false;
  const values = product.options[0].values;
  const inputs = [];
  const labels = [];
  values.forEach((value) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const mainText = document.createElement("span");
    if (
      (!isDependent(product) && !value.in_stock) ||
      (isDependent(product) &&
        Object.keys(product.stock)
          .filter((key) => key.includes(value.id))
          .every((key) => product.stock[key] <= 0))
    )
      input.setAttribute("disabled", "disabled");
    else if (!hasChecked) {
      hasChecked = true;
      input.checked = true;
    }
    mainText.innerHTML = value.name;
    label.classList.add("text-selector");
    label.for = `${product.id}-${product.options[0].id}-${value.id}`;
    input.id = `${product.id}-${product.options[0].id}-${value.id}`;
    input.value = value.id;
    input.name = `${product.id}-${product.options[0].id}`;
    input.type = "radio";
    label.appendChild(input);
    label.appendChild(mainText);
    inputs.push(input);
    labels.push(label);
    input.addEventListener("change", () => {
      image.src = value.images[0];
    });
  });
  return [labels, inputs];
};

export default createTextSelector;
