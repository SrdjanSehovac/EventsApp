# Legal documents (DRAFTS — lawyer review required)

Source of truth for Jaunta's Terms of Use, Privacy Policy and Event Liability
Disclaimer. EventServer serves copies of these files at:

- https://51-161-102-13.sslip.io/legal/terms
- https://51-161-102-13.sslip.io/legal/privacy
- https://51-161-102-13.sslip.io/legal/disclaimer

When you change a document:

1. Edit it here and bump the version date on its second line.
2. Copy it to EventServer `api/legal/docs/` and bump the matching version in
   `api/legal/versions.py`, then deploy.
3. Bump `LEGAL_VERSIONS` in `src/legal/versions.ts` and publish an update.
   Signed-in users are asked to accept the new version on next launch
   (the server reports `legal.needs_acceptance`).
