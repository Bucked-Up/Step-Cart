// jsdom has no layout engine, so scrollIntoView is missing; the cart calls it when a
// dependent selector is left unpicked.
if (!window.Element.prototype.scrollIntoView) window.Element.prototype.scrollIntoView = () => {};
