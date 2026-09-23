/*
# Fix SECURITY DEFINER function permissions

## Security Changes
- Revoke EXECUTE on all SECURITY DEFINER functions from anon role
- Set search_path on update_updated_at function
- These functions are only called via triggers (not directly), so anon doesn't need EXECUTE

## Notes
1. check_mutual_like, handle_like_deleted, notify_new_message, handle_new_user are trigger functions
2. They run with the privileges of the table owner, not the calling user
3. Revoking EXECUTE from anon prevents direct API calls to these functions
*/

REVOKE EXECUTE ON FUNCTION public.check_mutual_like() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_like_deleted() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- Fix mutable search_path
ALTER FUNCTION public.update_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;