---
name: gps-reviews
description: >-
  List and reply to Google Play reviews with gps or MCP. Use when the user asks
  about store reviews, ratings comments, or developer replies.
---

# Play reviews

```bash
gps --package $PKG reviews list --max-results 20 --translation-language en --json
gps --package $PKG reviews get REVIEW_ID
gps --package $PKG reviews reply REVIEW_ID "Thanks for the feedback!" --confirm
```

MCP: `gps_list_reviews`, `gps_get_review`, `gps_reply_to_review`.

## Rules

- Keep replies professional, short, and language-matched when possible.
- Empty list is often normal (API returns only recent reply-eligible reviews).
- Confirm auth with `tracks list` / `whoami` if everything looks empty.
- Always get user approval before posting a reply.
