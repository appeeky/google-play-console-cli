---
name: gps-monetization
description: >-
  Inspect and manage Google Play subscriptions, one-time products, offers, and
  legacy IAPs with gps. Use for product catalogs, base plans, offers, or regional
  price conversion — not purchase-token refunds (see gps-purchases).
---

# Monetization catalogs

```bash
gps --package $PKG subscriptions list --json
gps --package $PKG subscriptions get monthly_premium
gps --package $PKG otp list --json
gps --package $PKG iap list --json
gps --package $PKG convert-prices --currency USD --units 9 --nanos 990000000
```

Advanced create/patch/batch/base-plan/offer ops:

```bash
gps ops subscription
gps ops offer
gps call gps_get_subscription '{"packageName":"'"$PKG"'","productId":"monthly_premium"}'
```

## Rules

- Prefer subscriptions / OTP APIs for new catalogs; `iap` is legacy `inappproducts`.
- Do not invent prices or product ids — read first, then patch with user-provided fields.
- Purchase tokens, acknowledge, refund → skill `gps-purchases`.
