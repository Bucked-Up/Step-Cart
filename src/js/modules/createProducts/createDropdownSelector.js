const createDropdownSelector = ({ product, image }) => {
  const dropdown = document.createElement("div");
  dropdown.classList.add("cart__dropdown-selector");
  const arrowIcon = new DOMParser().parseFromString('<svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.833008 0.83252L5.82911 5.82862L10.8252 0.83252" stroke="#99A1AF" stroke-width="1.66537" stroke-linecap="round" stroke-linejoin="round"/></svg>', "image/svg+xml").documentElement;
  const selectedWrapper = document.createElement("div");
  selectedWrapper.classList.add("cart__dropdown-selector__selected-wrapper");
  const selected = document.createElement("span");
  const availableValue = product.options[0].values.find((value) => value.in_stock);
  selected.innerHTML = availableValue.name;
  dropdown.appendChild(selectedWrapper);
  selectedWrapper.appendChild(selected);
  selectedWrapper.appendChild(arrowIcon);

  const variantsWrapper = document.createElement("div");
  variantsWrapper.classList.add("cart__dropdown-selector__variants-wrapper");
  dropdown.appendChild(variantsWrapper);

  dropdown.addEventListener("click", () => {
    dropdown.classList.toggle("active");
  });
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) || e.target.tagName === "INPUT") dropdown.classList.remove("active");
  });

  const inputs = [];

  product.options[0].values.forEach((value) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    input.type = "radio";
    input.name = `${product.id}-${product.options[0].id}`;
    input.value = value.id;
    label.for = `${product.id}-${product.options[0].id}`;
    label.appendChild(input);
    text.innerHTML = value.name;
    variantsWrapper.appendChild(label);
    label.appendChild(text);
    inputs.push(input);

    if (!value.in_stock) input.setAttribute("disabled", "disabled");
    input.addEventListener("change", () => {
      selected.innerHTML = value.name;
      image.src = value.images[0];
      image.alt = value.name;
    });
  });

  return [dropdown, inputs];
};

export default createDropdownSelector;
