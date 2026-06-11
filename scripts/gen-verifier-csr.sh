#!/usr/bin/env bash
#
# Generates an EC P-256 private key + CSR for a new "Yivi Verzekeringen"
# verifier RP cert. The CSR embeds a UTF-8 JSON blob in OID 2.1.123.1
# containing the org's display name, logo, and authorized credentials —
# which the Yivi EUDI wallet renders on the consent screen.
#
# Usage:
#   ./scripts/gen-verifier-csr.sh path/to/logo.png
#
# Output files in compose/insurance-verifier/:
#   verifierapi-insurance.openid4vc.staging.yivi.app.key   private key, PEM (PKCS#8). keep secret.
#   verifierapi-insurance.openid4vc.staging.yivi.app.csr   CSR, PEM. submit this to EJBCA.
#
# After EJBCA signs the CSR (End Entity profile "Yivi Relying Party",
# Certificate Profile "Yivi Requestor Server Profile", CA "Yivi Relying
# Parties CA"), return the signed leaf cert + chain so we can build the
# keystore.p12.

set -euo pipefail

LOGO_PATH="${1:-}"
if [ -z "$LOGO_PATH" ] || [ ! -f "$LOGO_PATH" ]; then
  echo "usage: $0 <path-to-logo.png>" >&2
  echo "       (PNG file; ideally <8 KB so the cert stays small)" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/compose/insurance-verifier"
HOST="verifierapi-insurance.openid4vc.staging.yivi.app"

mkdir -p "$OUT_DIR"

for cmd in openssl jq base64; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: '$cmd' is required but not installed" >&2
    exit 1
  fi
done

LOGO_BASE64=$(base64 < "$LOGO_PATH" | tr -d '\n')

# RP metadata. Yivi wallet renders organization.legalName + organization.logo
# on the consent screen. The 'authorized' list must contain *every* credential
# + attribute we'll ever request from this verifier — adding new ones later
# requires a new cert (per docs.yivi.app).
RP_JSON=$(jq -nc \
  --arg host "$HOST" \
  --arg logo "$LOGO_BASE64" \
  '{
    registration: ("https://portal.staging.yivi.app/organizations/yivi-verzekeringen/"),
    organization: {
      logo: { mimeType: "image/png", data: $logo },
      legalName: { en: "Yivi Verzekeringen", nl: "Yivi Verzekeringen" }
    },
    rp: {
      authorized: [
        {
          credential: "pbdf-staging.pbdf.passport",
          attributes: ["firstName", "lastName", "dateOfBirth"]
        },
        {
          credential: "pbdf-staging.pbdf.idcard",
          attributes: ["firstName", "lastName", "dateOfBirth"]
        },
        {
          credential: "pbdf-staging.pbdf.drivinglicence",
          attributes: ["firstName", "lastName", "dateOfBirth"]
        }
      ],
      purpose: {
        nl: "Identificatie voor klantregistratie bij Yivi Verzekeringen",
        en: "Identification for customer registration at Yivi Verzekeringen"
      }
    }
  }')

ESCAPED_JSON=$(echo "$RP_JSON" | jq -R)

cat > "$OUT_DIR/$HOST.cnf" <<EOF
[ req ]
default_md         = sha256
distinguished_name = req_distinguished_name
prompt             = no
req_extensions     = v3_req

[ req_distinguished_name ]
C  = NL
O  = Yivi Verzekeringen
CN = $HOST

[ v3_req ]
subjectAltName   = @alt_names
extendedKeyUsage = clientAuth
keyUsage         = digitalSignature, keyEncipherment
basicConstraints = critical, CA:FALSE
2.1.123.1        = ASN1:UTF8String:$ESCAPED_JSON

[ alt_names ]
DNS.0 = $HOST
EOF

# EC P-256 key. The Yivi Requestor Server Profile requires this curve.
openssl ecparam -name prime256v1 -genkey -noout -outform DER -out "$OUT_DIR/$HOST.der.key"
openssl pkcs8 -topk8 -inform DER -outform PEM -nocrypt \
  -in "$OUT_DIR/$HOST.der.key" -out "$OUT_DIR/$HOST.key"
rm -f "$OUT_DIR/$HOST.der.key"

openssl req -new -config "$OUT_DIR/$HOST.cnf" \
  -key "$OUT_DIR/$HOST.key" \
  -out "$OUT_DIR/$HOST.csr"

rm -f "$OUT_DIR/$HOST.cnf"

cat <<EOF

Generated:
  $OUT_DIR/$HOST.key   (PRIVATE KEY — keep local, never commit)
  $OUT_DIR/$HOST.csr   (CSR to submit to EJBCA)

Verify the CSR contents:
  openssl req -in $OUT_DIR/$HOST.csr -noout -text

Next steps:
  1. Sign in to EJBCA RA at https://ca.yivi.app/ejbca/ra/
  2. Add a new End Entity with profile 'Yivi Relying Party':
       - Common Name: $HOST
       - O: Yivi
       - C: NL
       - E-mail: (your team alias)
       - DNS SAN: $HOST (×3 — duplicate if EJBCA requires)
  3. Upload the CSR ($OUT_DIR/$HOST.csr), select Certificate Profile
     'Yivi Requestor Server Profile' under CA 'Yivi Relying Parties CA'.
  4. Download the signed certificate AND the CA chain (PEM).
     Save them as:
       $OUT_DIR/$HOST.crt        (signed leaf, PEM)
       $OUT_DIR/$HOST.chain.pem  (intermediate + root, PEM bundle)
  5. Tell me when both files are in place; I'll build the keystore.p12
     and add the dedicated verifier deployment to openid4vc-poc-ops.
EOF
