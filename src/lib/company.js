import { supabase } from './supabase'

let _company = null

export async function getCompany() {
  if (_company) return _company

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('profiles')
    .select('company_id, is_super_admin, companies(*)')
    .eq('id', user.id)
    .single()

  if (error) throw new Error('Perfil não encontrado')

  _company = {
    ...(data.companies || {}),
    is_super_admin: data.is_super_admin || false,
  }
  return _company
}

export async function getCompanyId() {
  const c = await getCompany()
  return c.id
}

export function updateCompanyCache(updates) {
  if (_company) _company = { ..._company, ...updates }
}

export function clearCompany() {
  _company = null
}
