import { supabase } from './supabase'

export const api = {
  // ── Products ──────────────────────────────────
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories!category_id(id, name, woo_id), subcategory:categories!subcategory_id(id, name, woo_id), brand:brands(id, name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories!category_id(id, name, woo_id), subcategory:categories!subcategory_id(id, name, woo_id), brand:brands(id, name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories!category_id(id, name, woo_id), subcategory:categories!subcategory_id(id, name, woo_id), brand:brands(id, name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async createProduct(product) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
    if (error) throw error
    return data[0]
  },

  async updateProduct(id, product) {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    return true
  },

  // ── Categories ────────────────────────────────
  async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:categories(id, name)')
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createCategory(category) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
    if (error) throw error
    return data[0]
  },

  async updateCategory(id, category) {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    return true
  },

  // ── Brands ────────────────────────────────────
  async getAllBrands() {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createBrand(brand) {
    const { data, error } = await supabase.from('brands').insert([brand]).select()
    if (error) throw error
    return data[0]
  },

  async updateBrand(id, brand) {
    const { data, error } = await supabase.from('brands').update(brand).eq('id', id).select()
    if (error) throw error
    return data[0]
  },

  async deleteBrand(id) {
    const { error } = await supabase.from('brands').delete().eq('id', id)
    if (error) throw error
    return true
  },

  // ── Tags ──────────────────────────────────────
  async getAllTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createTag(tag) {
    const { data, error } = await supabase.from('tags').insert([tag]).select()
    if (error) throw error
    return data[0]
  },

  async updateTag(id, tag) {
    const { data, error } = await supabase.from('tags').update(tag).eq('id', id).select()
    if (error) throw error
    return data[0]
  },

  async deleteTag(id) {
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) throw error
    return true
  },

  // ── Attributes ────────────────────────────────
  async getAllAttributes() {
    const { data, error } = await supabase
      .from('attributes')
      .select('*, terms:attribute_terms!attribute_terms_attribute_id_fkey(*)')
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createAttribute(attr) {
    const { data, error } = await supabase.from('attributes').insert([attr]).select()
    if (error) throw error
    return data[0]
  },

  async updateAttribute(id, attr) {
    const { data, error } = await supabase.from('attributes').update(attr).eq('id', id).select()
    if (error) throw error
    return data[0]
  },

  async deleteAttribute(id) {
    const { error } = await supabase.from('attributes').delete().eq('id', id)
    if (error) throw error
    return true
  },

  async createAttributeTerm(term) {
    const { data, error } = await supabase.from('attribute_terms').insert([term]).select()
    if (error) throw error
    return data[0]
  },

  async updateAttributeTerm(id, term) {
    const { data, error } = await supabase.from('attribute_terms').update(term).eq('id', id).select()
    if (error) throw error
    return data[0]
  },

  async deleteAttributeTerm(id) {
    const { error } = await supabase.from('attribute_terms').delete().eq('id', id)
    if (error) throw error
    return true
  },

  // ── Reviews ───────────────────────────────────
  async getReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, product:products(id, name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ── Analytics Settings ────────────────────────
  async getAnalyticsSettings() {
    const { data, error } = await supabase
      .from('analytics_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (error) return { default_period: 30, revenue_goal: 0, low_stock_threshold: 5, sync_interval: 10 }
    return data
  },

  async updateAnalyticsSettings(settings) {
    const { data, error } = await supabase
      .from('analytics_settings')
      .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() })
      .select()
    if (error) throw error
    return data[0]
  },

  // ── WooCommerce Credentials ───────────────────
  async getWooCredentials() {
    const { data, error } = await supabase
      .from('marketplace_credentials')
      .select('*')
      .eq('marketplace', 'woocommerce')
      .single()
    if (error) return null
    return data
  },

  async upsertWooCredentials(creds) {
    const { data, error } = await supabase
      .from('marketplace_credentials')
      .upsert({
        marketplace: 'woocommerce',
        ...creds,
        updated_at: new Date().toISOString()
      }, { onConflict: 'marketplace' })
      .select()
    if (error) throw error
    return data[0]
  },

  // ── Sync Logs ─────────────────────────────────
  async getSyncLogs({ page = 1, pageSize = 20, status, entity_type } = {}) {
    let query = supabase
      .from('marketplace_sync_log')
      .select('*', { count: 'exact' })
      .eq('marketplace', 'woocommerce')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (status) query = query.eq('status', status)
    if (entity_type) query = query.eq('entity_type', entity_type)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  // ── Dashboard Stats ───────────────────────────
  async getDashboardStats() {
    const [productsRes, categoriesRes, brandsRes, tagsRes] = await Promise.all([
      supabase.from('products').select('id, status, price, stock', { count: 'exact' }),
      supabase.from('categories').select('id', { count: 'exact' }),
      supabase.from('brands').select('id', { count: 'exact' }),
      supabase.from('tags').select('id', { count: 'exact' }),
    ])

    const products = productsRes.data || []
    const activeProducts = products.filter(p => p.status === 'active').length
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0)
    const lowStock = products.filter(p => (p.stock || 0) < 5 && p.status === 'active').length

    return {
      totalProducts: products.length,
      activeProducts,
      totalCategories: categoriesRes.count || 0,
      totalBrands: brandsRes.count || 0,
      totalTags: tagsRes.count || 0,
      totalValue,
      lowStock,
    }
  },

  // ── Banners ───────────────────────────────────
  async getAllBanners() {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('order_index', { ascending: true })
    if (error) throw error
    return data || []
  },
}

// WooCommerce proxy via Supabase Edge Function (evita CORS)
// credentials: opcional, para usar credenciais do form sem precisar salvar antes
export async function wooProxy({ method = 'GET', endpoint, body, credentials } = {}) {
  const { data, error } = await supabase.functions.invoke('woo-proxy', {
    body: { method, endpoint, body, credentials }
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}
