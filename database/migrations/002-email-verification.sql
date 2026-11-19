-- Existing accounts keep their current access. Public registrations explicitly set email_verified_at to NULL.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash CHAR(64) NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at DATETIME NULL;
