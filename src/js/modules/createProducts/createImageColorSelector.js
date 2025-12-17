import isDependent from "./isDepentent.js";

const getColors = (name) => {
  let colors;
  if (name.includes("-")) {
    colors = name.split("-");
  } else {
    colors = name.split("/");
  }
  const primary = colors[0].trim();
  const secondary = colors[1].replace("Logo", "").trim();
  let finalPrimary;
  let finalSecondary;
  switch (primary) {
    case "White":
      finalPrimary = "#fff";
      break;
    case "Black":
      finalPrimary = "#000";
      break;
    case "Red":
      finalPrimary = "#db0024";
      break;
    case "Neon Blue":
      finalPrimary = "#018cff";
      break;
    case "Blue":
      finalPrimary = "#1b7ec6";
      break;
    case "Military Green":
      finalPrimary = "#544f37";
      break;
    case "Light Olive":
      finalPrimary = "#95a667";
      break;
    case "Sand":
      finalPrimary = "#c4a88e";
      break;
    case "Heather Dk Gray":
      finalPrimary = "#7b838a";
      break;
    case "Heather Blue":
      finalPrimary = "#7b838a";
      break;
    default:
      finalPrimary = "#fff";
  }
  switch (secondary) {
    case "American Flag":
      finalSecondary = "linear-gradient(135deg, rgb(43, 110, 197) 50%, rgb(226, 61, 55) 50%)";
      break;
    case "Blue":
      finalSecondary = "#21a1e9";
      break;
    case "Red":
      finalSecondary = "#e6001b";
      break;
    case "White":
      finalSecondary = "#fff";
      break;
    case "Black":
      finalSecondary = "#000";
      break;
    default:
      finalSecondary = "#fff";
  }
  return [finalPrimary, finalSecondary];
};

const createImageColorSelector = ({ product, image, subTitle }) => {
  let hasChecked = false;
  const selectors = [];
  const inputs = [];
  product.options[0].values.map((value) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    label.classList.add("color-image-selector");
    label.for = `${product.id}-${product.options[0].id}-${value.id}`;
    input.id = `${product.id}-${product.options[0].id}-${value.id}`;
    input.value = value.id;
    input.name = `${product.id}-${product.options[0].id}`;
    input.type = "radio";
    if ((!isDependent(product) && !value.in_stock) || (isDependent(product) && Object.keys(product.stock).filter(key=>key.includes(value.id)).every(key=>product.stock[key] <= 0))) input.setAttribute("disabled", "disabled");
    else if (!hasChecked) {
      hasChecked = true;
      input.checked = true;
    }
    label.appendChild(input);
    if (product.configs.selector === "images") {
      const selectorImage = document.createElement("img");
      const valueName = document.createElement("span")
      valueName.innerHTML = value.name
      selectorImage.src = value.images[0];
      selectorImage.alt = `${product.options[0].name}-${value.name}`;
      label.appendChild(selectorImage);
      label.appendChild(valueName);
    } else {
      const [primary, secondary] = getColors(value.name);
      const selectorColor = document.createElement("span");
      const selectorInnerColor = document.createElement("span");
      selectorInnerColor.style.background = primary;
      selectorColor.style.background = secondary;
      selectorColor.appendChild(selectorInnerColor);
      selectorColor.classList.add("color-selector");
      label.appendChild(selectorColor);
    }
    selectors.push(label);
    inputs.push(input);

    input.addEventListener("change", () => {
      image.src = value.images[0];
      image.alt = `${product.name} / ${value.name}`;
      subTitle.innerHTML = value.name;
    });
  });
  return [selectors, inputs];
};

export default createImageColorSelector;
