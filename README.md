# Step-Cart

A JavaScript library for creating a multi-step shopping cart interface.

## Installation

Include the step-cart.min.js file and the CSS stylesheet in your project:

```html
<link rel="stylesheet" href="./src/scss/style.css">
<script src="./step-cart.min.js"></script>
```

## Usage

```javascript
stepCart({
  products: [
    { id: 924, newPrice: { value: "FREE" }, selector: "dropdown" },
  ],
  couponCode: "KSHOME"
})
```

## Parameters

### `products` (required)

Array of product configurations.

**Product Object Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | number | Product ID (required) |
| `newPrice` | object | Override price with `{ value: "$29.99" }` or `{ value: "FREE" }` |
| `newPrice.affect` | number | For quantity discounts (e.g., buy 3, pay for 2) |
| `quantity` | number | Default quantity to add (default: 1) |
| `name` | string | Custom product name display |
| `desc` | string | Custom product description |
| `selector` | string | Variant UI: `"text"`, `"images"`, or `"colors"`. Omit for the default (dropdown, or image-color when a variant depends on another selection) |
| `variant` | number | Pre-selected variant ID (skips variant selection) |
| `recurring` | object | Enables subscription option. Shape: `{ percent: number }` — the discount % shown next to the recurring line. Requires radio inputs named `{productId}-recurring` on the page for the user to pick the frequency |
| `notDiscounted` | boolean | Disable discount display for this product |
| `dynamicQtty` | object | Renders a `−` / input / `+` stepper on the card. Shape: `{ maxQtty: number, qttyTexts?: { [qty: string]: string }, addedTexts?: { [qty: string]: string | string[] }, couponCodes?: { [qty: string]: string }, bumpCouponCodes?: { [qty: string]: string } }` — `maxQtty` is the upper bound (min is always 1); optional `qttyTexts` reveals a progress bar at the top of the cart, filling from `qty/maxQtty` with the text pulled by current quantity (`qttyTexts["2"]` at qty 2). The bar turns green whenever the current quantity matches a bonus threshold (any `isBonus.parentQtty` that points at this product). `addedTexts` adds non-product perks to the unlocked list under the bar. `couponCodes` / `bumpCouponCodes` swap the checkout coupon as the quantity changes. See below |
| `attachQtty` | array | List of product IDs whose quantity should mirror this product's. Set on the product that has `dynamicQtty`. See below |
| `variantOrder` | array | Variant IDs to render first, in the given order. Every other variant keeps its original order. The first listed in-stock variant also becomes the default selection. See below |
| `isBonus` | object | Hides this product until a parent product's quantity crosses a threshold. Shape: `{ parentProd: number, parentQtty: number }` — reveals the card (and includes it at checkout) once the parent's qty is `≥ parentQtty`. Works with either a pre-selected `variant` (renders as a static card) or a variant product without `variant` (renders as a bonus card with an inline dropdown, same UI as the order bump — single-option variants only). Combine with the global `showBonus` flag to render locked bonuses as a grayed-out preview instead of hiding them. See below |

**`newPrice.affect` example** — apply the discount to only part of the quantity. `{ id: 924, quantity: 3, newPrice: { value: "$20", affect: 2 } }` renders as one full-price card (qty 1) and one discounted card (qty 2 at $20 each).

**`dynamicQtty` / `attachQtty` / `isBonus` example** — the three options are designed to work together to build bundle offers that scale with the user's chosen quantity:

```javascript
products: [
  { id: 1275, dynamicQtty: { maxQtty: 3, qttyTexts: { "1": "1 pack", "2": "Free shirt unlocked!", "3": "Free shirt + shaker!" } }, attachQtty: [123] },
  { id: 123, newPrice: { value: "FREE" } },
  { id: 201, variant: 11951, newPrice: { value: "FREE" }, isBonus: { parentProd: 1275, parentQtty: 2 } },
  { id: 924, variant: 14003, newPrice: { value: "FREE" }, isBonus: {parentProd: 1275, parentQtty: 3 } }
]
```

Behavior with the config above: product `1275` gets a stepper (1–3). When the user changes it, product `123` follows the same quantity (via `attachQtty`), product `201` appears once qty ≥ 2, and product `924` appears once qty = 3. Hidden bonuses are excluded from the checkout URL — only currently-visible ones ship. Notes:

- `dynamicQtty` only applies to products rendered as a static card — i.e. products with no options, `type: "static"`, or a pre-selected `variant`.
- Products listed in `attachQtty` do not need `dynamicQtty` themselves; their qty is driven by the parent.
- `isBonus` products are added to / removed from the cart as the threshold is crossed. Products with a pre-selected `variant` render as a static card; products with variants but no `variant` render as a card with an inline dropdown selector (single-option variants only, matching the order bump) so shoppers can pick the variant they'll receive.
- When `qttyTexts` is set, a progress bar renders at the top of the cart (below the header, above the products). Its fill width tracks `currentQty / maxQtty`, its label is `qttyTexts[String(currentQty)]`, and the whole bar (track background + fill) turns green when `currentQty` equals any bonus threshold tied to this product — so users get a visual "unlocked!" confirmation.

**`addedTexts` — perks that aren't products** — the list under the progress bar normally names the `isBonus` products unlocked so far. `addedTexts` adds entries that have no product behind them, keyed by the quantity that unlocks them:

```javascript
dynamicQtty: {
  maxQtty: 3,
  qttyTexts: { "1": "1 pack", "2": "Free shipping unlocked!", "3": "Free shirt too!" },
  addedTexts: { "2": "Free Shipping", "3": ["Free Gift", "VIP Access"] }
}
```

- A tier takes one string or an array of them, and each renders like the product lines: **Free Shipping** added.
- Entries are cumulative — a perk at `"2"` stays listed at 3 — and sort in with the product bonuses by quantity, perks first when they share a tier.
- Reaching a perk's quantity turns the bar green, exactly as an `isBonus` threshold does.
- Perks are display only. They add nothing to the cart, the total, or the checkout URL — pair one with a `couponCodes` tier if the perk has to reach checkout.
- `addedTexts` renders the progress bar on its own, so `qttyTexts` is optional (the label above the track is then blank). The strings may carry HTML.

**Per-quantity coupon codes** — `dynamicQtty.couponCodes` swaps the coupon sent at checkout as the stepper moves, so a bundle can be priced by a different code at each tier:

```javascript
products: [
  {
    id: 1275,
    dynamicQtty: {
      maxQtty: 3,
      couponCodes: { "2": "BUNDLE2", "3": "BUNDLE3" },
      bumpCouponCodes: { "2": "BUMP2", "3": "BUMP3" }
    }
  }
],
couponCode: "SINGLE",
bump: { product: { id: 934, newPrice: { value: "$37.49" } }, couponCode: "SINGLE_BUMP" }
```

- Quantities absent from the map fall back to the coupon configured on `stepCart` (or on the clicked `buttonOptions` entry), so only the tiers that change the deal need listing. With the config above, qty 1 checks out on `SINGLE`, qty 2 on `BUNDLE2`.
- `bumpCouponCodes` is the same map for the coupon that applies *while the order bump is added*, falling back to `bump.couponCode` / `buttonOptions[…].bumpCoupon`.
- Both sides stay live: changing the quantity while a bump is added updates the bump coupon and the code that gets restored when the bump is removed, in either order.
- Coupons resolve at render too, so a product configured with `quantity: 3` opens the cart already on the qty-3 code.
- The stepper drives this, so a `noCart` button — which checks out immediately without rendering one — always uses the base coupon.

### `couponCode` (string)

Global coupon code applied to the entire cart.

### `country` (string)

Region for checkout URL routing:
- `"us-main"` - buckedup.com
- `"uk"` - buckedup.co.uk
- `"us"` - funnels.buckedup.com (default)
- Other: `{country}.buckedup.com`

### `bump` (object)

Order bump configuration. Renders an "add to cart" offer beneath the cart's products. Adding the bump can also **rewrite the displayed price of other products already in the cart** (e.g. flip one to `"FREE"`) via `changePrices`.

```javascript
bump: {
  product: {
    id: 201,
    newPrice: { value: "$9.99" },        // required — the bump's added price
    changePrices: [                       // optional — rewrites other cart products' prices while the bump is added
      { id: 924, newPrice: "FREE" },      // "FREE" is rendered in red
      { id: 925, newPrice: "$19.99" }
    ]
  },
  title: "Add a shaker cup for $9.99!",   // header above the bump card
  couponCode: "BUMP20"                    // replaces the active coupon while the bump is added
}
```

**Bump properties:**

| Property | Type | Description |
|----------|------|-------------|
| `product.id` | number | Bump product ID (required) |
| `product.newPrice` | object | `{ value: "$9.99" }` — required; used as the amount added to the total |
| `product.changePrices` | array | Optional list of `{ id, newPrice }`. Each `id` must reference a product in the top-level `products` array. `newPrice` is a string like `"$19.99"` or the literal `"FREE"` |
| `title` | string | Heading text. On classic bumps it's shown above the bump card (defaults to "You may also like:"). On `isStep` bumps it's the red headline above the bump step image (defaults to "UPGRADE YOUR ORDER!") |
| `couponCode` | string | Coupon applied while the bump is added; reverts on remove. Per-button `bumpCoupon` overrides this |
| `isStep` | boolean | When `true`, renders the bump as the last wizard step (image + `ADD TO CART` + `SKIP`) instead of the classic card in the bumps wrapper. Supports both static and variant bumps. Ignored in `inline-products` mode (falls back to the classic card) |

**Behavior:** on ADD the coupon swaps to the bump coupon, the bump card moves into the cart products, each `changePrices` entry rewrites the matching product's displayed price, and the total is recalculated. Clicking ADDED TO CART reverses everything. Bumps that are out of stock are skipped automatically.

With `isStep: true`, the bump becomes the final wizard step. `ADD TO CART` applies the same coupon/price/total mutations described above and then advances (closing the wizard). `SKIP` advances without adding — and reverses the bump if it was applied on a previous visit (e.g. the shopper stepped back and forward again).

### `buttonOptions` (object)

Per-button configuration for multiple cart buttons:

```javascript
buttonOptions: {
  "btn-1": {
    products: [{ id: 924 }],
    couponCode: "BUTTON1",
    bumpCoupon: "BUMP10",
    noCart: true
  },
  "btn-2": {
    products: [{ id: 925, quantity: 2 }]
  }
}
```

**Button Option Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `products` | array | Products specific to this button |
| `couponCode` | string | Coupon for this button's cart |
| `bumpCoupon` | string | Override bump coupon |
| `noCart` | boolean | Skip cart UI, go directly to checkout |

Every `cart-button` click clears and rebuilds the cart from that button's config (or the global config if the button has no entry), so per-button `products`/`couponCode` never leak between clicks.

### `showFullPricing` (boolean)

Global option. When `true`, renders **Subtotal** and **Discount** rows in the cart footer directly above the total. Subtotal is the sum of each product's `basePrice × quantity` before any `newPrice` override / FREE / bonus; Discount is `subtotal − total` (shown in green). Defaults to `false`, which keeps the original UI (total only). Kept in sync automatically as quantities change, bonuses toggle, and bumps flip prices.

### `showBonus` (boolean)

Global option. When `true`, `isBonus` products are rendered in the cart from the start in a **locked** state — visible but grayed out (`opacity` + `grayscale`, non-interactive) — so shoppers can see what they'd get before hitting the threshold. Once the parent product's qty reaches `parentQtty`, the bonus un-grays and joins the totals / qty badge / checkout payload. Defaults to `false`, which keeps the original behavior (bonuses fully hidden until unlocked). Locked bonuses are always excluded from totals and checkout regardless of this flag.

### `noCart` (boolean)

Global option. When `true`, skips the cart UI and goes directly to checkout with all configured products.

```javascript
stepCart({
  products: [{ id: 924, variant: 12345 }],
  couponCode: "DIRECT",
  noCart: true
})
```

> Only static products and products with a pre-selected `variant` are sent through in `noCart` mode. A product that normally requires variant selection but has no `variant` set is silently skipped, since there is no UI to pick it.

## HTML Requirements

### Cart Button

Add the `cart-button` attribute to any element that should open the cart:

```html
<button cart-button>Buy Now</button>
<button id="btn-2" cart-button>Buy Product 2</button>
```

For button-specific products, use the `id` attribute and configure in `buttonOptions`.

### Inline Products

To display products directly on the page instead of in the cart modal:

```html
<div inline-products></div>
```

When `[inline-products]` is present, product cards render on page load (no button click needed), and the bump section (if configured) renders inline too. Clicking any `cart-button` will first check the inline products for any element marked `[invalid]` — if one exists, the page scrolls to it and checkout is blocked until it is resolved.

## Product Types

### Static Products

Products without variants. Automatically added to cart.

```javascript
{ id: 924 }
```

### Products with Variants

Products with selectable options. Uses step-by-step selection. Omit `selector` to get the default (dropdown), or pick one of `"text"`, `"images"`, `"colors"`:

```javascript
{ id: 924, selector: "images" }
```

Use `variantOrder` to pull specific variants to the front of the list. Anything not listed follows in its original order:

```javascript
{ id: 924, selector: "images", variantOrder: [14003, 11951] }
```

The first listed variant that is in stock also becomes the pre-selected one, so it drives the initial image, description and price. IDs that don't belong to the product are ignored. On products where one variant depends on another (color + size), this reorders the primary list only — sizes are left alone.

### Pre-selected Variant

Skip variant selection by specifying a variant:

```javascript
{ id: 924, variant: 12345 }
```

## Example

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./src/scss/style.css">
</head>
<body>
  <button cart-button id="btn-1">Buy Now</button>
  <button cart-button id="btn-2">Buy Bundle</button>

  <script src="./step-cart.min.js"></script>
  <script>
    stepCart({
      products: [
        { id: 924, newPrice: { value: "$29.99" }, quantity: 1 },
      ],
      couponCode: "SAVE10",
      country: "us",
      bump: {
        product: {
          id: 500,
          newPrice: { value: "$9.99" },
          changePrices: [{ id: 924, newPrice: "FREE" }]
        },
        title: "Add a shaker cup for $9.99!"
      },
      buttonOptions: {
        "btn-2": {
          products: [
            { id: 924, quantity: 2 },
            { id: 925 }
          ],
          couponCode: "BUNDLE20"
        }
      }
    })
  </script>
</body>
</html>
```

## Development

Node version is pinned in `.nvmrc`.

```bash
npm install
npm test            # vitest + jsdom, no network
npm run test:watch  # same suite in watch mode
npm run build       # runs the tests, then writes step-cart.min.js
```

`npm run build` is gated on `npm test` (a `prebuild` script), so `step-cart.min.js` can never be produced from failing source.

The suite lives in `tests/` and drives the real library through jsdom — it opens carts, clicks steppers, bumps and selectors, and asserts the resulting totals and checkout URL. `fetch` is stubbed from responses captured in `tests/fixtures/`, so nothing hits the network. To refresh a fixture, or add one for a new product:

```bash
curl -s "https://funnels.buckedup.com/product/json/detail?product_id=1275" > tests/fixtures/product-1275.json
```

Then add the id to `FIXTURE_IDS` in `tests/helpers/harness.js`.
