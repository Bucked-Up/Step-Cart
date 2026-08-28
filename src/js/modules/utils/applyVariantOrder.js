// Hoists the variant ids listed in configs.variantOrder to the front of the primary
// option, in the given order. Every other variant keeps its original relative order.
// apiProducts are fetched once and reused across cart-button clicks, so the pristine
// order is snapshotted on the option and every call rebuilds from it — that keeps
// per-button variantOrder configs from stacking on top of each other.
const applyVariantOrder = (product) => {
  const option = product.options?.[0];
  if (!option?.values) return;
  if (!option.originalValues) option.originalValues = [...option.values];
  const original = option.originalValues;
  const order = product.configs?.variantOrder;
  if (!order?.length) {
    option.values = [...original];
    return;
  }
  const first = [];
  order.forEach((id) => {
    const value = original.find((value) => value.id == id);
    if (value && !first.includes(value)) first.push(value);
  });
  option.values = [...first, ...original.filter((value) => !first.includes(value))];
};

export default applyVariantOrder;
