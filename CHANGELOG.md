# 1.3.0 - original character preparation

- Catalogue expanded to 72 entries: 52 ordinary cards, 9 Pororo, 11 Baby Shark.
- Generated character art removed; original-image importer and local storage added.
- Parent character tab supports batch, per-card retry, stop, source disclosure, custom overrides, and read-back verified storage.
- Ordinary-card display separated from character image selection. Existing custom photos are preserved; one-time uniform-default migration fixes accidental cat photograph display.
- Image failures are visible and never activate nonexistent cards. Completed entries are skipped when retrying.
- Download preparation has no AI/API-key dependency; existing voice settings are preserved.
- Existing IndexedDB IDs and original eight character IDs unchanged. Character artwork included in backup/restore.
- Worker cache version advanced; no media database deletion.
- Unreadable Naver page explicitly recorded as not included.

This release has not been deployed into the user's account. Source data was inspected online, but live Vercel source downloads and physical iOS behavior remain untested.
