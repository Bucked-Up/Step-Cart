import { addStaticProduct, getApiProducts } from "../data.js";
import createStaticProduct from "./createStaticProduct.js";
import createStep from "./createStep.js";
import isStatic from "./isStatic.js";

const createProducts = ({ wrapper, stepsWrapper, stepsText, stepsBack, backToSteps, cartQuantity }) => {
  const products = getApiProducts();
  const steps = [];
  const stepButtons = [];
  let currentStep = 0;
  products.forEach((product) => {
    cartQuantity.innerHTML = Number(cartQuantity.innerHTML) + (product.configs.quantity || 1);
    if (isStatic(product)) {
      addStaticProduct({ product, quantity: product.configs.quantity || 1 });
      const affect = product.configs.newPrice?.affect;
      if (affect) {
        const rest = product.configs.quantity - affect;
        wrapper.appendChild(createStaticProduct(product, false, rest));
        wrapper.appendChild(createStaticProduct(product, true, product.configs.quantity - rest));
      } else wrapper.appendChild(createStaticProduct(product));
    } else {
      const [step, button] = createStep({ product, wrapper, stepsWrapper });
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
