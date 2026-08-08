-- Verifies a wallet session JWT (issued by issueWalletSessionToken) and returns
-- the wallet address if valid, NULL otherwise. Mirrors request_wallet_address()
-- but returns a cryptographically verified wallet rather than trusting a raw
-- client-supplied header. RLS policies should check against this function,
-- not request_wallet_address(), once policies move beyond permissive.
--
-- Depends on verify_wallet_jwt(token) already existing (built in an earlier
-- session, reads the HS256 secret from Supabase Vault under 'wallet_auth_secret').

CREATE OR REPLACE FUNCTION public.request_verified_wallet_address()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.verify_wallet_jwt(
    nullif(
      trim(
        coalesce(
          current_setting('request.headers', true)::json->>'x-wallet-session-token',
          ''
        )
      ),
      ''
    )
  );
$$;
