# Security

This repository is a benchmark coordinator and a static gallery. It does not store user accounts.

Gallery winner votes use one anonymous `ab_voter` cookie (UUID, HttpOnly, SameSite=Lax). The Worker stores `voter_id`, `prompt_id`, `model_id`, and timestamps in D1. It does not store IP, User-Agent, or session analytics. A second browser or a private window can vote again. That is accepted for this public crown.

## Report a vulnerability

Do not open a public issue for a suspected secret or exploit.

Use [GitHub private vulnerability reporting](https://github.com/gvastethecreator/autonomy-bench/security/advisories/new) if it is enabled. Otherwise email the maintainer through the GitHub profile on [gvastethecreator](https://github.com/gvastethecreator).

Include:

- the affected path or command
- what an attacker can do
- a minimal reproduction

Do not attach live secrets, private keys, or full `.env` files.

## Secrets in this project

Workers and CLIs need their own provider credentials. Do not commit API keys, tokens, or `.env` files.

GitHub Actions deploys with repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Do not put those values in the tree.

Receipts record observable facts only. Unknown values stay `not captured`.

If a secret lands in git, rotate it, then open a private report. Do not paste the value.
