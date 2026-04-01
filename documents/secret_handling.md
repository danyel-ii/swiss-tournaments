# Secret Handling

## Goal

Keep runtime secrets out of the repository, out of tracked files, and out of long-lived local plaintext files whenever possible.

## Rules

- Never commit real secrets.
- Do not keep `.env` or `.env.*` files in the repo unless they are temporary and actively needed.
- Keep only [`.env.example`](/Users/danyel-ii/SwissTournaments/.env.example) as the documented variable template.
- Treat local pulled Vercel env files as disposable working copies, not permanent configuration files.

## Current Local Workflow

### 1. Use the template for required variable names

Reference:

- [`.env.example`](/Users/danyel-ii/SwissTournaments/.env.example)

### 2. Pull secrets only when needed

Use the Vercel CLI to pull a local copy when actively debugging or running secured runtime checks:

```bash
vercel env pull .env.vercel.local
```

### 3. Remove the pulled file after use

After the task is finished, delete the local plaintext file:

```bash
rm -f .env.vercel.local
```

### 4. Prefer shell-scoped variables for short tasks

For one-off checks, prefer exporting only the minimum needed variables into the current shell instead of storing them in a file.

## Repository Guardrails

The repo ignore policy now treats `.env*` files as ignored by default while still allowing:

- [`.env.example`](/Users/danyel-ii/SwissTournaments/.env.example)

This reduces the chance of accidental commits of secret-bearing files.

## Incident Response Guidance

If a secret-bearing local file has been copied, shared, screenshotted, or committed anywhere:

1. Rotate database credentials.
2. Rotate any password hashes or underlying passwords that may have been exposed.
3. Revoke and reissue temporary platform tokens.
4. Delete the local file after rotation.

## Why This Approach

This app only needs a small set of runtime secrets, so the safest low-friction process is:

- document the names in one safe template
- pull real values only on demand
- remove local plaintext copies afterward

That keeps the developer workflow simple without normalizing secret storage inside the repository.
