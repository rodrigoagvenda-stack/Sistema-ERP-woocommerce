import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

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

  // Qualquer usuário autenticado via Supabase tem acesso
  return !!user;
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
