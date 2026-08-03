const createQuantitySelector = ({ initialQty = 1, maxQtty = 1, onChange }) => {
  const element = document.createElement("div");
  element.classList.add("cart__product__qtty-selector");

  const minusButton = document.createElement("button");
  minusButton.type = "button";
  minusButton.classList.add("cart__product__qtty-selector__button");
  minusButton.innerHTML = "−";

  const input = document.createElement("input");
  input.type = "number";
  input.classList.add("cart__product__qtty-selector__input");
  input.min = "1";
  input.max = String(maxQtty);
  input.value = String(initialQty);

  const plusButton = document.createElement("button");
  plusButton.type = "button";
  plusButton.classList.add("cart__product__qtty-selector__button");
  plusButton.innerHTML = "+";

  element.appendChild(minusButton);
  element.appendChild(input);
  element.appendChild(plusButton);

  let currentQty = initialQty;

  const syncDisabled = () => {
    minusButton.disabled = currentQty <= 1;
    plusButton.disabled = currentQty >= maxQtty;
  };

  const applyQty = (nextQty) => {
    const clamped = Math.max(1, Math.min(maxQtty, Math.floor(nextQty) || 1));
    if (clamped === currentQty) {
      input.value = String(clamped);
      return;
    }
    const previous = currentQty;
    currentQty = clamped;
    input.value = String(clamped);
    syncDisabled();
    if (onChange) onChange(clamped, previous);
  };

  minusButton.addEventListener("click", () => applyQty(currentQty - 1));
  plusButton.addEventListener("click", () => applyQty(currentQty + 1));
  input.addEventListener("change", () => applyQty(Number(input.value)));

  syncDisabled();

  return { element, setQty: applyQty };
};

export default createQuantitySelector;
