import { addStaticProduct, getApiProducts } from "../data.js";
import createStaticProduct from "./createStaticProduct.js";
import createStep from "./createStep.js";
import isStatic from "./isStatic.js";

const createProducts = ({ wrapper, stepsWrapper, stepsText, stepsBack }) => {
  const products = getApiProducts();
  const steps = [];
  const stepButtons = [];
  let currentStep = 0;
  products.forEach((product) => {
    if (isStatic(product)) {
      addStaticProduct({ product });
      wrapper.appendChild(createStaticProduct(product));
    } else {
      const [step, button] = createStep({ product, wrapper, stepsWrapper });
      steps.push(step);
      stepButtons.push(button);
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
        steps[currentStep].classList.remove("active");
        if (i === steps.length - 1) {
          stepsWrapper.classList.remove("active");
          return;
        }
        stepsBack.classList.add("active");
        currentStep++;
        stepsText.innerHTML = `Step ${currentStep + 1} of ${steps.length}`;
        steps[currentStep].classList.add("active");
      });
    });
  }
};

export default createProducts;
