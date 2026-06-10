-- Veramo Issuer and Verifier share a single postgres database with separate
-- schemas (`agent` for the issuer, `verifier` for the verifier), matching
-- the staging deployment.
CREATE SCHEMA IF NOT EXISTS agent;
CREATE SCHEMA IF NOT EXISTS verifier;
