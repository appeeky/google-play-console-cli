---
name: gps-purchases
description: >-
  Inspect Google Play product/subscription purchases, acknowledge or consume,
  voided purchases, and order refunds with gps. Use for purchase tokens, refunds,
  revoke/cancel subscription, or voided purchase lookups.
---

# Purchases and orders

## Product purchases

```bash
gps --package $PKG purchases product PRODUCT_ID TOKEN
gps --package $PKG purchases product-v2 PRODUCT_ID TOKEN
gps --package $PKG purchases ack-product PRODUCT_ID TOKEN --confirm
gps --package $PKG purchases consume PRODUCT_ID TOKEN --confirm
```

## Subscriptions

```bash
gps --package $PKG purchases subscription TOKEN
gps --package $PKG purchases cancel-subscription SUBSCRIPTION_ID TOKEN --confirm
gps --package $PKG purchases revoke-subscription SUBSCRIPTION_ID TOKEN --confirm
```

Defer / acknowledge via ops: `gps_defer_subscription`, `gps_acknowledge_subscription`.

## Voided + orders

```bash
gps --package $PKG purchases voided --json
gps --package $PKG orders get ORDER_ID
gps --package $PKG orders refund ORDER_ID --confirm
```

## Safety

- Never refund/revoke/cancel without explicit user confirmation.
- Prefer inspect (`get` / `subscription` / `voided`) first.
- MCP: `gps_get_product_purchase`, `gps_get_subscription_purchase`, `gps_refund_order`, …
