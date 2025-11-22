import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';

// Validação e logs ANTES de criar o cliente
console.group('🔧 Inicializando Supabase');
console.log('📍 URL:', ENV.SUPABASE_URL);
console.log('🔑 ANON_KEY:', ENV.SUPABASE_ANON_KEY ? `${ENV.SUPABASE_ANON_KEY.substring(0, 20)}...` : 'FALTANDO');

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('VITE_SUPABASE_URL:', ENV.SUPABASE_URL);
  console.error('VITE_SUPABASE_ANON_KEY:', ENV.SUPABASE_ANON_KEY ? 'Configurada' : 'FALTANDO');
}

// Criar cliente Supabase
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

// Teste de conexão ao inicializar
supabase.from('categories').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
    } else {
      console.log('✅ Supabase conectado com sucesso!');
      console.log(`📊 ${count || 0} categorias no banco`);
    }
    console.groupEnd();
  })
  .catch(err => {
    console.error('❌ Erro fatal ao testar conexão:', err);
    console.groupEnd();
  });

// Helper para obter usuário atual
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
  return user;
};

// Helper para verificar se usuário é admin
export const isAdmin = async () => {
  const user = await getCurrentUser();
  if (!user) return false;

  // Verificar se o email está na lista de admins ou se tem role admin
  const adminEmails = ['admin@lukayagriffe.com', 'diguinsilva@gmail.com'];
  return adminEmails.includes(user.email);
};

// Helper para login
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

// Helper para signup
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

// Helper para logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};
