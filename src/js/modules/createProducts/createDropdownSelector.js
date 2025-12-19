const createDropdownSelector = ({ product }) => {
  const dropdown = document.createElement("div");
  dropdown.classList.add("cart__dropdown-selector");
  const arrowIcon = new DOMParser().parseFromString('<svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5981 15.5C11.4434 17.5 8.55662 17.5 7.40192 15.5L1.33975 5C0.185047 3 1.62842 0.499998 3.93782 0.499998L16.0622 0.499999C18.3716 0.5 19.815 3 18.6603 5L12.5981 15.5Z" fill="black"></path></svg>', "image/svg+xml").documentElement;
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
    });
  });

  return [dropdown, inputs];
};

export default createDropdownSelector;
