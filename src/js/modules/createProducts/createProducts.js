import { addRegularProduct, addStaticProduct, getApiProducts, getBumpProduct, getBumpWrapper, getGlobalQuantity, getProductsWrapper, getSubtotal, getTotalValue, removeProduct, setGlobalQuantity, setSubtotal, setTotalValue } from "../data.js";
import createPlaceholderProduct from "./createPlaceholderProduct.js";
import createQuantitySelector from "./createQuantitySelector.js";
import createRegularProduct from "./createRegularProduct.js";
import createStaticProduct from "./createStaticProduct.js";
import createStep from "./createStep.js";
import handleProductWithSetVariant from "./handleProductWithSetVariant.js";
import isStatic from "./isStatic.js";

const createProducts = ({ stepsWrapper, stepsText, stepsBack, backToSteps, isBump, showBonus }) => {
  const wrapper = isBump ? getBumpWrapper() : getProductsWrapper();
  const products = isBump ? [getBumpProduct()] : getApiProducts();
  const steps = [];
  const stepButtons = [];
  const cardMap = new Map();
  let currentStep = 0;
  products.forEach((product) => {
    if (!isBump) setGlobalQuantity(getGlobalQuantity() + (product.configs.quantity || 1));
    if (product.configs.variant) {
      const value = handleProductWithSetVariant({ product });
      product.image = value.images[0];
      const { card, recomputeCard, contributionFor, subtotalFor, initialQty } = createStaticProduct({ product, isBump });
      wrapper.appendChild(card);
      if (!isBump) {
        cardMap.set(Number(product.id), {
          card,
          recomputeCard,
          contributionFor,
          subtotalFor,
          initialQty,
          product,
          kind: "variant",
          choice: `${product.options[0].id}-${value.id}`,
          hidden: false,
        });
      }
      if (stepsWrapper.hasAttribute("inline-products")) stepsWrapper.appendChild(createPlaceholderProduct({ product }));
      return;
    }
    if (isStatic(product)) {
      if (!isBump) addStaticProduct({ product, quantity: product.configs.quantity || 1 });
      const affect = product.configs.newPrice?.affect;
      if (affect) {
        const rest = product.configs.quantity - affect;
        wrapper.appendChild(createStaticProduct({ product, isDiscounted: false, prodQuantity: rest }).card);
        wrapper.appendChild(createStaticProduct({ product, prodQuantity: product.configs.quantity - rest }).card);
      } else {
        const { card, recomputeCard, contributionFor, subtotalFor, initialQty } = createStaticProduct({ product, isBump });
        wrapper.appendChild(card);
        if (!isBump) {
          cardMap.set(Number(product.id), {
            card,
            recomputeCard,
            contributionFor,
            subtotalFor,
            initialQty,
            product,
            kind: "static",
            hidden: false,
          });
        }
      }
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
  if (!isBump) wireDynamicFeatures({ products, cardMap, showBonus });
  if (steps.length > 0) {
    stepsWrapper.classList.add("active");
    if (stepsText) stepsText.innerHTML = `Step ${currentStep + 1} of ${steps.length}`;
    steps[0].classList.add("active");
    stepsBack.addEventListener("click", () => {
      if (currentStep === 0) return;
      steps[currentStep].classList.remove("active");
      currentStep--;
      steps[currentStep].classList.add("active");
      if (stepsText) stepsText.innerHTML = `Step ${currentStep + 1} of ${steps.length}`;
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
        if (stepsText) stepsText.innerHTML = `Step ${currentStep + 1} of ${steps.length}`;
        steps[currentStep].classList.add("active");
      });
    });
  }
};

const lockBonus = (entry, { showBonus }) => {
  if (entry.hidden) return;
  entry.hidden = true;
  if (showBonus) {
    entry.card.classList.add("cart__product--locked");
  } else {
    entry.card.style.display = "none";
  }
  const contribution = entry.contributionFor(entry.initialQty);
  if (contribution !== 0) setTotalValue(getTotalValue() - contribution);
  const subtotalContribution = entry.subtotalFor(entry.initialQty);
  if (subtotalContribution !== 0) setSubtotal(getSubtotal() - subtotalContribution);
  setGlobalQuantity(getGlobalQuantity() - entry.initialQty);
  removeProduct({ product: entry.product });
};

const unlockBonus = (entry, { showBonus }) => {
  if (!entry.hidden) return;
  entry.hidden = false;
  if (showBonus) {
    entry.card.classList.remove("cart__product--locked");
  } else {
    entry.card.style.display = "";
  }
  const contribution = entry.contributionFor(entry.initialQty);
  if (contribution !== 0) setTotalValue(getTotalValue() + contribution);
  const subtotalContribution = entry.subtotalFor(entry.initialQty);
  if (subtotalContribution !== 0) setSubtotal(getSubtotal() + subtotalContribution);
  setGlobalQuantity(getGlobalQuantity() + entry.initialQty);
  if (entry.kind === "variant") {
    addRegularProduct({ product: entry.product, choice: entry.choice });
  } else {
    addStaticProduct({ product: entry.product, quantity: entry.initialQty });
  }
};

const wireDynamicFeatures = ({ products, cardMap, showBonus }) => {
  const parentQtyFor = (parentId) => {
    const parent = products.find((p) => p.id == parentId);
    if (!parent) return 0;
    return parent.configs.quantity || 1;
  };

  products.forEach((product) => {
    const bonusConfig = product.configs.isBonus;
    if (!bonusConfig) return;
    const entry = cardMap.get(Number(product.id));
    if (!entry) return;
    if (parentQtyFor(bonusConfig.parentProd) < bonusConfig.parentQtty) lockBonus(entry, { showBonus });
  });

  products.forEach((product) => {
    const dyn = product.configs.dynamicQtty;
    if (!dyn) return;
    const parentEntry = cardMap.get(Number(product.id));
    if (!parentEntry) return;
    const initialQty = product.configs.quantity || 1;

    let updateProgress = () => {};
    if (dyn.qttyTexts) {
      const progressEl = document.querySelector("[cart-progress]");
      const fillEl = document.querySelector("[cart-progress-fill]");
      const textEl = document.querySelector("[cart-progress-text]");
      const addedEl = document.querySelector("[cart-progress-added]");
      if (progressEl && fillEl && textEl) {
        const goals = new Set(
          products
            .map((p) => p.configs.isBonus)
            .filter((bc) => bc && bc.parentProd == product.id)
            .map((bc) => Number(bc.parentQtty)),
        );
        const bonusList = products
          .filter((p) => p.configs.isBonus && p.configs.isBonus.parentProd == product.id)
          .map((p) => ({ name: p.configs.name || p.name, parentQtty: Number(p.configs.isBonus.parentQtty) }))
          .sort((a, b) => a.parentQtty - b.parentQtty);
        progressEl.style.display = "";
        updateProgress = (qty) => {
          fillEl.style.width = `${Math.min(100, (qty / dyn.maxQtty) * 100)}%`;
          textEl.innerHTML = dyn.qttyTexts[String(qty)] || "";
          progressEl.classList.toggle("cart__progress--met", goals.has(qty));
          if (addedEl) {
            addedEl.innerHTML = bonusList
              .filter((b) => qty >= b.parentQtty)
              .map((b) => `<p><b>${b.name}</b> added</p>`)
              .join("");
          }
        };
        updateProgress(initialQty);
      }
    }

    const { element } = createQuantitySelector({
      initialQty,
      maxQtty: dyn.maxQtty,
      onChange: (newQty) => {
        parentEntry.recomputeCard(newQty);
        (product.configs.attachQtty || []).forEach((attachedId) => {
          const attachedEntry = cardMap.get(Number(attachedId));
          if (!attachedEntry) return;
          attachedEntry.recomputeCard(newQty);
          const card = attachedEntry.card;
          card.classList.remove("cart__product--bumped");
          void card.offsetWidth;
          card.classList.add("cart__product--bumped");
        });
        products.forEach((otherProduct) => {
          const bc = otherProduct.configs.isBonus;
          if (!bc || bc.parentProd != product.id) return;
          const bonusEntry = cardMap.get(Number(otherProduct.id));
          if (!bonusEntry) return;
          if (newQty >= bc.parentQtty) unlockBonus(bonusEntry, { showBonus });
          else lockBonus(bonusEntry, { showBonus });
        });
        updateProgress(newQty);
      },
    });
    const texts = parentEntry.card.querySelector(".cart__product__texts");
    (texts || parentEntry.card).appendChild(element);
  });
};

export default createProducts;
