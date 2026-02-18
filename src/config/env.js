// Utilitário para ler variáveis de ambiente
// Funciona tanto em desenvolvimento (Vite) quanto em produção (Docker/Easypanel)

const getEnvVar = (key) => {
  // Em produção (Docker/Easypanel), usar window._env_
  if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
    return window._env_[key];
  }

  // Em desenvolvimento, usar import.meta.env
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }

  return null;
};

export const ENV = {
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  WHATSAPP_NUMBER: getEnvVar('VITE_WHATSAPP_NUMBER') || '',
};

// Validar variáveis obrigatórias
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error(
    '❌ ERRO: Variáveis de ambiente obrigatórias não configuradas.\n' +
    'Configure no Easypanel: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY'
  );
}
