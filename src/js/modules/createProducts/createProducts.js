import { addRegularProduct, addStaticProduct, getApiProducts, getBumpProduct, getBumpWrapper, getGlobalQuantity, getProductsWrapper, setGlobalQuantity } from "../data.js";
import createRegularProduct from "./createRegularProduct.js";
import createStaticProduct from "./createStaticProduct.js";
import createStep from "./createStep.js";
import isStatic from "./isStatic.js";

const createProducts = ({ stepsWrapper, stepsText, stepsBack, backToSteps, isBump }) => {
  const wrapper = isBump ? getBumpWrapper() : getProductsWrapper();
  const products = isBump ? [getBumpProduct()] : getApiProducts();
  const steps = [];
  const stepButtons = [];
  let currentStep = 0;
  products.forEach((product) => {
    if (!isBump) setGlobalQuantity(getGlobalQuantity() + (product.configs.quantity || 1));
    if (product.configs.variant) {
      const value = product.options[0].values.find((value) => value.id == product.configs.variant);
      addRegularProduct({product, choice: `${product.options[0].id}-${value.id}`})
      product.image = value.images[0]
      wrapper.appendChild(createStaticProduct({ product, isBump }));
      return;
    }
    if (isStatic(product)) {
      if (!isBump) addStaticProduct({ product, quantity: product.configs.quantity || 1 });
      const affect = product.configs.newPrice?.affect;
      if (affect) {
        const rest = product.configs.quantity - affect;
        wrapper.appendChild(createStaticProduct({ product, isDiscounted: false, prodQuantity: rest }));
        wrapper.appendChild(createStaticProduct({ product, prodQuantity: product.configs.quantity - rest }));
      } else wrapper.appendChild(createStaticProduct({ product, isBump }));
    } else if (isBump) {
      wrapper.appendChild(createRegularProduct({ product, isBump }));
    } else {
      const [step, button] = createStep({ product, stepsWrapper });
      steps.push(step);
      stepButtons.push(button);
      backToSteps.classList.add("active");
      backToSteps.addEventListener("click", () => stepsWrapper.classList.add("active"));
    }
  });
  if (steps.length > 0) {
    stepsWrapper.classList.add("active");
    stepsText.innerHTML = `Step ${currentStep + 1} of ${steps.length}`;
    steps[0].classList.add("active");
    stepsBack.addEventListener("click", () => {
      if (currentStep === 0) return;
      steps[currentStep].classList.remove("active");
      currentStep--;
      steps[currentStep].classList.add("active");
      stepsText.innerHTML = `Step ${currentStep + 1} of ${steps.length}`;
      if (currentStep === 0) stepsBack.classList.remove("active");
    });
    stepButtons.forEach((button, i) => {
      button.addEventListener("click", () => {
        const invalidSelector = steps[currentStep].querySelector("[invalid]");
        if (invalidSelector) {
          invalidSelector.classList.add("invalid");
          return;
        }
        if (i === steps.length - 1) {
          stepsWrapper.classList.remove("active");
          return;
        }
        steps[currentStep].classList.remove("active");
        stepsBack.classList.add("active");
        currentStep++;
        stepsText.innerHTML = `Step ${currentStep + 1} of ${steps.length}`;
        steps[currentStep].classList.add("active");
      });
    });
  }
};

export default createProducts;
