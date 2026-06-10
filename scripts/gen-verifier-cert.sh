#!/usr/bin/env bash
#
# Generates a self-signed x509 cert + key for the local EUDI verifier with
# SAN DNS=localhost, packaged as a PKCS#12 keystore at compose/eudi-verifier/keystore.p12.
#
# The cert also embeds a Yivi-style RP authorization JSON in the custom OID
# 2.1.123.1 (matches the convention in openid4vc-poc-ops/create-verifier-cert.md).
#
# One-time setup per dev machine.  Run once before `docker compose up`.
# The wallet must be told to trust the resulting cert (see compose/eudi-verifier/localhost.crt).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/compose/eudi-verifier"
HOST=localhost
EUDI_PORT=18083

mkdir -p "$OUT_DIR"

for cmd in openssl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: '$cmd' is required but not installed" >&2
    exit 1
  fi
done

RP_JSON=$(cat <<EOF
{
  "registration": "http://localhost:5173/about/",
  "organization": {
    "logo": { "mimeType": "image/png", "data": "" },
    "legalName": { "en": "Yivi Verzekeringen", "nl": "Yivi Verzekeringen" }
  },
  "rp": {
    "authorized": [
      { "credential": "pbdf-staging.pbdf.passport", "attributes": ["firstName", "lastName", "dateOfBirth"] },
      { "credential": "pbdf-staging.pbdf.idcard",   "attributes": ["firstName", "lastName", "dateOfBirth"] }
    ],
    "purpose": {
      "nl": "Identificatie voor klantregistratie bij Yivi Verzekeringen",
      "en": "Identification for customer registration at Yivi Verzekeringen"
    }
  }
}
EOF
)

ESCAPED_JSON=$(echo "$RP_JSON" | jq -c | jq -R)

cat > "$OUT_DIR/$HOST.cnf" <<EOF
[ req ]
default_md         = sha256
distinguished_name = req_distinguished_name
prompt             = no
req_extensions     = v3_req
x509_extensions    = v3_ext

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

[ v3_ext ]
subjectAltName   = @alt_names
extendedKeyUsage = clientAuth
keyUsage         = digitalSignature, keyEncipherment
basicConstraints = critical, CA:FALSE
2.1.123.1        = ASN1:UTF8String:$ESCAPED_JSON
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid:always,issuer

[ alt_names ]
DNS.0 = $HOST
URI.1 = http://$HOST:$EUDI_PORT
EOF

openssl ecparam -name prime256v1 -genkey -noout -out "$OUT_DIR/$HOST.key"

openssl req \
  -new -x509 -days 3650 \
  -key "$OUT_DIR/$HOST.key" \
  -out "$OUT_DIR/$HOST.crt" \
  -config "$OUT_DIR/$HOST.cnf" \
  -extensions v3_ext

openssl pkcs12 -export \
  -inkey "$OUT_DIR/$HOST.key" \
  -in "$OUT_DIR/$HOST.crt" \
  -name verifier_cert \
  -out "$OUT_DIR/keystore.p12" \
  -passout pass:changeit

rm -f "$OUT_DIR/$HOST.cnf"

cat <<EOF

Generated:
  $OUT_DIR/keystore.p12   (mounted into the eudi-verifier container)
  $OUT_DIR/$HOST.crt      (load into the Yivi EUDI wallet's verifier trust list)
  $OUT_DIR/$HOST.key      (kept locally; never commit)

Next steps:
  1. Add localhost.crt to the wallet's verifier trust anchors (one-time).
  2. docker compose up
  3. ./scripts/adb-reverse.sh   # forwards ports onto the wallet
EOF
