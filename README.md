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
| `selector` | string | Selector type: `"dropdown"`, `"text"`, `"image-color"`, `"size"` |
| `variant` | number | Pre-selected variant ID (skips variant selection) |
| `recurring` | number | Pre-selected recurring option ID |
| `notDiscounted` | boolean | Disable discount display for this product |

### `couponCode` (string)

Global coupon code applied to the entire cart.

### `country` (string)

Region for checkout URL routing:
- `"us-main"` - buckedup.com
- `"uk"` - buckedup.co.uk
- `"us"` - funnels.buckedup.com (default)
- Other: `{country}.buckedup.com`

### `bump` (object)

Order bump configuration:

```javascript
bump: {
  product: { id: 123 },
  title: "Add this exclusive offer!",
  couponCode: "BUMP20"
}
```

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

### `noCart` (boolean)

Global option. When `true`, skips the cart UI and goes directly to checkout with all configured products.

```javascript
stepCart({
  products: [{ id: 924, variant: 12345 }],
  couponCode: "DIRECT",
  noCart: true
})
```

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

## Product Types

### Static Products

Products without variants. Automatically added to cart.

```javascript
{ id: 924 }
```

### Products with Variants

Products with selectable options. Uses step-by-step selection:

```javascript
{ id: 924, selector: "dropdown" }
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
        product: { id: 500 },
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
