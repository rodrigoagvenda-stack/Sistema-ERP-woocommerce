// Utilitário para ler variáveis de ambiente
// Funciona tanto em desenvolvimento (Vite) quanto em produção (Docker)

const getEnvVar = (key) => {
  // Em produção (Docker), usar window._env_
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
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL') || 'https://hnkhihzeqtzqzybkjype.supabase.co',
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hpaHplcXR6cXp5YmtqeXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzAyNjMsImV4cCI6MjA3NzE0NjI2M30.FWsLnIruhnwigbjLl0dSI5Bx1sg2S_JU7ubE-fGdqaA',
  WHATSAPP_NUMBER: getEnvVar('VITE_WHATSAPP_NUMBER') || '+5511986751552'
};

// Validar variáveis obrigatórias
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas. Usando valores demo.');
}

console.log('🔧 Configuração carregada:', {
  supabaseConfigured: !!ENV.SUPABASE_URL,
  whatsapp: ENV.WHATSAPP_NUMBER
});
