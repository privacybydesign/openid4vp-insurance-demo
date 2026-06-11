# Yivi Verzekeringen — OpenID4VP/4VCI insurance demo

A demo showing how an insurer can:

1. **Identify** a customer using their passport, ID card or driving licence (OpenID4VP, x509 certificate trust).
2. **Issue** a pseudonymous customer card (OpenID4VCI, DID trust).
3. **Re-authenticate** the customer on a return visit using only that pseudonym (OpenID4VP, DID trust) — no name or date of birth disclosed.

The fictional insurer is **Yivi Verzekeringen**. The UI is in Dutch.

**Live demo:** https://insurance-demo.openid4vc.staging.yivi.app

## Architecture

Wallets enforce HTTPS for OpenID4VP/4VCI endpoints, so the protocol services cannot live at `localhost` over a phone tether. The demo therefore always uses the **staging** protocol services — even when the frontend + backend are run locally.

```
this repo
├── frontend     Vite dev server :5173 (locally) / behind nginx ingress (staging)
└── backend      Express :3001
                 │
                 │ HTTPS
                 ▼
   veramo-issuer.openid4vc.staging.yivi.app          (issues InsurancePseudonymCredential)
   veramo-verifier.openid4vc.staging.yivi.app        (verifies InsurancePseudonymCredential)
   verifierapi-insurance.openid4vc.staging.yivi.app  (dedicated EUDI verifier, RP = "Yivi Verzekeringen")
```

The Terraform for the staging deployment lives in **[openid4vc-poc-ops](https://github.com/privacybydesign/openid4vc-poc-ops)**:

- `insurance-demo.tf` — backend + frontend k8s Deployment / Service / Ingress
- `insurance-verifier.tf` — dedicated EUDI verifier instance (its keystore.p12 embeds the "Yivi Verzekeringen" RP cert)

## Quick start (local frontend + backend, staging protocol services)

```sh
docker compose up                 # frontend :5173, backend :3001, postgres
./scripts/adb-reverse.sh          # forwards :5173 + :3001 to a USB-tethered Android wallet
open http://localhost:5173
```

> The compose file also defines local `veramo-issuer`, `veramo-verifier`, and `eudi-verifier` services. They start but are **not used** — the backend env points unconditionally at the staging URLs (see `docker-compose.yml`). They're kept for future protocol-level experiments in isolation.

### Wallet prerequisites

For the wallet to satisfy the identification step, it needs a PID credential (`pbdf-staging.pbdf.passport`, `.idcard`, or `.drivinglicence`) issued by the staging PID Issuer at `eudiw-pid-issuer.openid4vc.staging.yivi.app`. Test identities are seeded via Keycloak in the ops repo: `openid4vc-poc-ops/environments/dev/keycloak/pid-issuer-users-0.json`.

The staging insurance-verifier presents an EJBCA-signed cert; no local trust-anchor setup is needed on the wallet.

## Demo flow

### `/registreren`

1. **Identificatie** — wallet discloses `firstName`, `lastName`, `dateOfBirth` over OpenID4VP from any one of: passport, ID card, or driving licence (`pbdf-staging.pbdf.{passport,idcard,drivinglicence}`).
2. **Polisnummer** — user enters their polisnummer. The backend strictly verifies that the polisnummer's stored name + DOB match the disclosed identity. A "Polisnummer invullen voor dit ID-bewijs" button autofills the matching polisnummer for demo smoothness.
3. **Klantenpas** — backend generates a random `YIVI-INS-XXXXXXXX` pseudonym, links it to the customer record in `db.json`, and issues an `InsurancePseudonymCredentialSdJwt` over OpenID4VCI (DID trust, Veramo Issuer). Wallet stores the card.

### `/inloggen`

1. Wallet discloses the `insurance_id` from the `InsurancePseudonymCredential` over OpenID4VP (DID trust, Veramo Verifier).
2. Backend looks up the customer record by `insurance_id` and shows "Welkom terug, [name] · polisnummer [n] · klant sinds [year]".

### Seeded customers

`backend/db.seed.json` ships these customers:

| Polisnummer | Naam                  | DOB        | Klant sinds |
| ----------- | --------------------- | ---------- | ----------- |
| 12345678    | Ruben Adriaan Hensen  | 1996-05-27 | 2018-03-14  |
| 87654321    | Erika Mustermann      | 1964-08-12 | 2020-09-01  |
| 11223344    | Jan Janssen           | 1972-11-30 | 2021-06-15  |
| 55667788    | Dibran Mulder         | 1991-05-14 | 2023-02-21  |

For a customer to be registerable end-to-end, the same identity has to exist in the staging PID Issuer's Keycloak (see "Wallet prerequisites" above).

## Repository layout

```
openid4vp-insurance-demo/
├── frontend/                       React 19 + Vite + TS + Tailwind v4
│   └── src/
│       ├── pages/                  Landing, Registreren, Inloggen
│       ├── components/             TopNav, StepCard, QrCard, PolisnummerForm
│       ├── api/                    typed client + polling
│       └── lib/cn.ts               tailwind class merge
├── backend/                        Node 22 + Express + TS
│   ├── src/
│   │   ├── routes/                 registreren, inloggen
│   │   ├── eudi.ts                 passport/idcard/drivinglicence disclosure
│   │   ├── veramo-issuer.ts        pseudonym issuance
│   │   ├── veramo-verifier.ts      pseudonym verification
│   │   ├── db.ts                   JSON file customer DB
│   │   ├── sessions.ts             in-memory sessions, 5-min TTL
│   │   └── pseudonym.ts            YIVI-INS-XXXXXXXX generator
│   └── db.seed.json                seed customers (committed)
├── compose/
│   ├── postgres/init.sql
│   ├── veramo-issuer/conf/         local-only veramo config (unused at runtime)
│   ├── veramo-verifier/conf/       local-only veramo config (unused at runtime)
│   ├── eudi-verifier/              local-only EUDI verifier keystore (gitignored, unused at runtime)
│   └── insurance-verifier/         staging RP key + EJBCA-signed cert + keystore.p12 (gitignored)
├── scripts/
│   ├── gen-verifier-csr.sh         generate CSR for the staging insurance-verifier RP cert
│   ├── gen-verifier-cert.sh        legacy local self-signed cert (kept for the unused local stack)
│   └── adb-reverse.sh              forward host ports to USB-tethered Android
├── .github/workflows/delivery.yml  builds + publishes :edge images to GHCR on push to main
└── docker-compose.yml
```

## Deployment

Push-to-deploy via two repos:

1. **This repo's `delivery.yml`** publishes images on every push to `main`:
   - `ghcr.io/privacybydesign/openid4vp-insurance-demo-frontend:edge`
   - `ghcr.io/privacybydesign/openid4vp-insurance-demo-backend:edge`
2. **`openid4vc-poc-ops`'s `insurance-demo.tf`** consumes those images with `image_pull_policy = "Always"`. New `:edge` images flow into the cluster on pod restart; structural changes need `terraform apply` (triggered via `gh workflow run deploy-dev.yml` after merging to ops `main`).

### Updating the insurance-verifier cert

The EUDI verifier identifies as "Yivi Verzekeringen" via an x509 cert with an embedded RP-metadata JSON blob (OID 2.1.123.1) that hardcodes the authorized credentials list. **Adding a new requested credential or attribute requires a new cert**:

```sh
./scripts/gen-verifier-csr.sh path/to/logo.png
# → submit the CSR to https://ca.yivi.app/ejbca/ra/
#   (End Entity profile "Yivi Relying Party",
#    Certificate Profile "Yivi Requestor Server Profile",
#    CA "Yivi Relying Parties CA")
# → drop the signed leaf + chain into compose/insurance-verifier/
# → rebuild keystore.p12 and copy it to openid4vc-poc-ops:
#     environments/dev/insurance-verifier-keystore.p12
# → terraform apply (the keystore is loaded via filebase64 into a Secret;
#   the deployment has a stakater/reloader annotation that restarts the pod)
```

## Development

- Edit `backend/src/*.ts` → `tsx watch` picks it up, the backend container restarts.
- Edit `frontend/src/*.tsx` → Vite HMR updates the browser without reload.
- Reset the customer DB to seed: `docker compose down -v && docker compose up`.

### Quick API smoke tests

```sh
curl -fsS  http://localhost:3001/api/health
curl -fsS  https://insurance-demo.openid4vc.staging.yivi.app/api/health

curl -sS -X POST http://localhost:3001/api/registreren/start | jq .
curl -sS -X POST https://insurance-demo.openid4vc.staging.yivi.app/api/registreren/start | jq .
```

### Typecheck

```sh
docker compose exec backend  npm run typecheck
docker compose exec frontend npm run typecheck
```

## Project status

- ✅ Frontend + backend run locally against staging protocol services
- ✅ Staging deployment live at https://insurance-demo.openid4vc.staging.yivi.app
- ✅ Demo flow protocol mechanics validated end-to-end (passport/idcard/drivinglicence → pseudonym issuance → pseudonym disclosure)
- ⏳ Live `drivinglicence` disclosure: code is wired up, but the staging insurance-verifier cert must be regenerated to authorize it before wallets will accept the request
- ⏳ End-to-end demo with a real wallet against staging
