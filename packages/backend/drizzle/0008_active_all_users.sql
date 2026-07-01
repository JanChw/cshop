-- Backfill existing users as verified (registered before email activation feature was introduced)
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;
