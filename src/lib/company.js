import { supabase } from './supabase'

let _company = null

export async function getCompany() {
  if (_company) return _company

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id, is_super_admin')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('Perfil não encontrado')

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  if (companyError) throw new Error('Empresa não encontrada')

  _company = {
    ...company,
    is_super_admin: profile.is_super_admin || false,
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
