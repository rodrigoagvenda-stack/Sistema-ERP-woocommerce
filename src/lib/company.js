import { supabase } from './supabase'

let _company = null
let _userId  = null

export async function getCompany() {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Usuário não autenticado')

  if (_company && _userId === user.id) return _company

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id, is_super_admin')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('Perfil não encontrado')
  if (!profile.company_id) throw new Error('Empresa não vinculada ao perfil')

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  if (companyError) throw new Error('Empresa não encontrada')

  _userId  = user.id
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
  _userId  = null
}
