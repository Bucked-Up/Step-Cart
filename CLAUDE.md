# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build

Single script — bundles `src/js/stepCart.js` with browserify + esmify and minifies with terser:

```
npm run build   # writes step-cart.min.js at the repo root
```

There is no lint, no test runner, and no CSS build step in `package.json`. `src/scss/style.scss` is compiled to `src/scss/style.css` out-of-band (VS Code Live Sass Compiler or similar) — if you edit the SCSS, also update the committed CSS so consumers loading `src/scss/style.css` stay in sync. Node version is pinned in `.nvmrc` (v20.19.5).

`step-cart.min.js` is a committed build artifact — the library ships as that file plus the CSS, so consumers copy those two files into their site. Rebuild it before committing JS changes.

`index.html` is a scratch harness that loads `src/js/stepCart.js` directly as an ES module for manual testing against real product IDs; open it with any static server.

## Runtime shape

The public API is a single function `window.stepCart({ products, couponCode, country, bump, buttonOptions, noCart })` — full parameter reference lives in `README.md`. Consumers include `step-cart.min.js` and the CSS on their page and call `stepCart(...)` once.

Update `README.md` when the *configurable* public API changes: a new/renamed/removed `stepCart(...)` option, or a new/renamed/removed product-config key (like `isBonus`, `dynamicQtty`, `attachQtty`). Add or update the row in the relevant properties table and, when the option is non-obvious, its dedicated section. `README.md` is a usability reference — it should tell consumers *what to configure and how*, not describe every visual polish or interaction detail. Internal refactors, styling tweaks, and UI enhancements that don't add a new knob do not need README changes.

## Architecture

Entry point `src/js/stepCart.js` orchestrates everything in a fixed sequence:

1. `fetchProducts` — hits a per-product endpoint. URL is selected by `country`:
   - `us-main` → `www.buckedup.com`, `uk` → `www.buckedup.co.uk`, other → `{country}.buckedup.com`.
   - The default (no country / `us`) currently points at a **Railway webhook proxy** (`webhook-processor-production-4aa3.up.railway.app/webhook/dev`), not `funnels.buckedup.com` — the funnels URL is commented out. Restore it before shipping if you change fetch behavior.
   - Each API response is annotated with `product.configs = <the caller-supplied config for that id>` so downstream code can reach both API data and user config off one object.
   - Out-of-stock bumps are dropped silently; out-of-stock main products throw and are handled by `handleError`.
2. `createCart` — injects the cart modal DOM (a single `innerHTML` string of minified markup) into `document.body` and registers wrappers/handlers with `data.js`. Skipped for `[inline-products]` mode, where the page's `<div inline-products>` becomes the steps wrapper.
3. `createProducts` — per product, dispatches to one of:
   - `handleProductWithSetVariant` when `configs.variant` is set (pre-selected variant, rendered as static),
   - `createStaticProduct` when `isStatic(product)` (no options or `type === "static"`),
   - `createStep` otherwise — one wizard step per variant product, wired into the "Step X of N" navigation.
   - `newPrice.affect` splits one static product into two cards (full-price remainder + discounted subset).
4. On checkout, `handlePurchase` walks the current products, builds a `products[i][id]=…&products[i][quantity]=…&products[i][options][opt]=val` query string, adds coupon + `rl_anonymous_id` cookie + `source_url`, calls `sendVibeLead`, and redirects to `{country-domain}/cart/add?…&clear=true`.

### The `data.js` module is the single source of truth

`src/js/modules/data.js` holds all mutable state (`apiProducts`, `products`, `globalQuantity`, `totalValue`, `couponCode`, `bumpProduct`, cart/bump DOM wrappers) in module-scoped `let`s. Every other module imports getters/setters from it. There is no store abstraction — treat it as a global. Consequences:

- `setGlobalQuantity` and `setTotalValue` do a direct `document.querySelector("[cart-qtty]" / "[cart-total]").innerHTML = …` on every call. Those attributes MUST exist in the DOM (they are injected by `createCart`) before any code that touches quantity or total runs.
- `reset()` clears the cart-scoped state (products, quantity, total) but **not** `apiProducts` or `couponCode` — those are re-set on each cart-button click via `initDefaultProducts` / `applyButtonOptions` in `stepCart.js`. When you add new state, decide up front whether `reset()` should clear it.
- Every `cart-button` click calls `resetCartUI()` and rebuilds from scratch (either the global config or the per-button entry in `buttonOptions`), so per-button `products`/`couponCode` never leak between clicks. Keep that invariant when adding cart-open paths.

### Selector rendering

`createStep` picks a selector implementation from `product.configs.selector`: `"text"` → `createTextSelector`, `"images"`/`"colors"` → `createImageColorSelector`, otherwise `createDropdownSelector` — except **dependent** products (variants where the stock key encodes two option IDs, detected by `isDependent`), which always render the image/color selector for the primary option and `createSizeSelectors` for the secondary, with cross-disabling on out-of-stock combinations.

### Bump behavior

`bump.product.changePrices` rewrites the displayed price of *other* products already in the cart while the bump is added (implemented in `createBumpButtons`). This mutates displayed prices only — the underlying cart lines still carry their own IDs — but the total is recomputed. On remove, everything reverses (including swapping the coupon back from `bump.couponCode` / per-button `bumpCoupon`).

### Loading + errors

`toggleLoading` adds/removes a `loading` class on `<body>` and locks scroll — it is toggled once at start and once at end of `stepCart`, and again around `handlePurchase`. A `pageshow` listener clears it on bfcache restores so a back-navigated page isn't stuck loading. Any thrown error in the top-level flow is caught and passed to `handleError`.
