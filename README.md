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

**`newPrice.affect` example** — apply the discount to only part of the quantity. `{ id: 924, quantity: 3, newPrice: { value: "$20", affect: 2 } }` renders as one full-price card (qty 1) and one discounted card (qty 2 at $20 each).

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
| `title` | string | Heading shown above the bump card (defaults to "You may also like:") |
| `couponCode` | string | Coupon applied while the bump is added; reverts on remove. Per-button `bumpCoupon` overrides this |

**Behavior:** on ADD the coupon swaps to the bump coupon, the bump card moves into the cart products, each `changePrices` entry rewrites the matching product's displayed price, and the total is recalculated. Clicking ADDED TO CART reverses everything. Bumps that are out of stock are skipped automatically.

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
