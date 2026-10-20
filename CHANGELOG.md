# Changelog

## 0.1.0

- Initial release: `@appeeky/google-play-store-core`, `gps` CLI, `gps-mcp`
- Android Publisher API v3 coverage: edits, deploy, tracks, listings/images, reviews, testers, monetization (subscriptions/OTP/IAP), purchases, orders, external transactions, users/grants, artifacts, generated/system APKs, internal sharing, data safety, app recovery, device tier configs
- Shared ops registry (`GPS_OPS`, 123 tools) drives MCP + `gps ops` / `gps call` for CLI/MCP parity
- Local-first service-account auth
- Vitest unit tests, GitHub Actions CI
- Agent skills under `skills/`
- Not in scope: GCS report imports, Play Developer Reporting / vitals, `appstorecatalog`, `orders.reviewRefund` (absent from googleapis 173)
