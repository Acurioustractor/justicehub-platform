export const DEV_ADMIN_BYPASS_COOKIE = 'funding_smoke_admin';

export function getDevAdminBypassSecret() {
  if (process.env.NODE_ENV === 'production') {
    return '';
  }

  return String(process.env.FUNDING_SMOKE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

export function hasDevAdminBypass(value?: string | null) {
  const secret = getDevAdminBypassSecret();
  return Boolean(secret && String(value || '').trim() === secret);
}

export function getDevAdminBypassUser() {
  return {
    id: '00000000-0000-4000-8000-00000000da7a',
    email: 'admin-smoke@justicehub.au',
  };
}
