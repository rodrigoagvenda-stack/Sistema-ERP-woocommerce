import { supabase } from './supabase'
import { getCompanyId } from './company'

export const api = {
  // ── Products ──────────────────────────────────
  async _enrichProducts(products) {
    const cid = await getCompanyId()
    const [catRes, brandRes] = await Promise.all([
      supabase.from('categories').select('id, name, woo_id').eq('company_id', cid),
      supabase.from('brands').select('id, name').eq('company_id', cid),
    ])
    const cats = catRes.data || []
    const brands = brandRes.data || []
    return products.map(p => ({
      ...p,
      category: cats.find(c => c.id === p.category_id) || null,
      subcategory: cats.find(c => c.id === p.subcategory_id) || null,
      brand: brands.find(b => b.id === p.brand_id) || null,
    }))
  },

  async getProducts() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', cid)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) throw error
    return this._enrichProducts(data || [])
  },

  async getAllProducts() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
    if (error) throw error
    return this._enrichProducts(data || [])
  },

  async getProductById(id) {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('company_id', cid)
      .single()
    if (error) throw error
    const enriched = await this._enrichProducts([data])
    return enriched[0]
  },

  async createProduct(product) {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, company_id: cid }])
      .select()
    if (error) throw error
    return data[0]
  },

  async updateProduct(id, product) {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .eq('company_id', cid)
      .select()
    if (error) throw error
    return data[0]
  },

  async deleteProduct(id) {
    const cid = await getCompanyId()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('company_id', cid)
    if (error) throw error
    return true
  },

  // ── Categories ────────────────────────────────
  async getAllCategories() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:categories(id, name)')
      .eq('company_id', cid)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createCategory(category) {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, company_id: cid }])
      .select()
    if (error) throw error
    return data[0]
  },

  async updateCategory(id, category) {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .eq('company_id', cid)
      .select()
    if (error) throw error
    return data[0]
  },

  async deleteCategory(id) {
    const cid = await getCompanyId()
    await supabase.from('products').update({ category_id: null }).eq('category_id', id).eq('company_id', cid)
    await supabase.from('products').update({ subcategory_id: null }).eq('subcategory_id', id).eq('company_id', cid)
    await supabase.from('categories').update({ parent_id: null }).eq('parent_id', id).eq('company_id', cid)
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('company_id', cid)
    if (error) throw error
    return true
  },

  // ── Brands ────────────────────────────────────
  async getAllBrands() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('company_id', cid)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createBrand(brand) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('brands').insert([{ ...brand, company_id: cid }]).select()
    if (error) throw error
    return data[0]
  },

  async updateBrand(id, brand) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('brands').update(brand).eq('id', id).eq('company_id', cid).select()
    if (error) throw error
    return data[0]
  },

  async deleteBrand(id) {
    const cid = await getCompanyId()
    const { error } = await supabase.from('brands').delete().eq('id', id).eq('company_id', cid)
    if (error) throw error
    return true
  },

  // ── Tags ──────────────────────────────────────
  async getAllTags() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('company_id', cid)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createTag(tag) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('tags').insert([{ ...tag, company_id: cid }]).select()
    if (error) throw error
    return data[0]
  },

  async updateTag(id, tag) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('tags').update(tag).eq('id', id).eq('company_id', cid).select()
    if (error) throw error
    return data[0]
  },

  async deleteTag(id) {
    const cid = await getCompanyId()
    const { error } = await supabase.from('tags').delete().eq('id', id).eq('company_id', cid)
    if (error) throw error
    return true
  },

  // ── Attributes ────────────────────────────────
  async getAllAttributes() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('attributes')
      .select('*, terms:attribute_terms!attribute_terms_attribute_id_fkey(*)')
      .eq('company_id', cid)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createAttribute(attr) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('attributes').insert([{ ...attr, company_id: cid }]).select()
    if (error) throw error
    return data[0]
  },

  async updateAttribute(id, attr) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('attributes').update(attr).eq('id', id).eq('company_id', cid).select()
    if (error) throw error
    return data[0]
  },

  async deleteAttribute(id) {
    const cid = await getCompanyId()
    const { error } = await supabase.from('attributes').delete().eq('id', id).eq('company_id', cid)
    if (error) throw error
    return true
  },

  async createAttributeTerm(term) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('attribute_terms').insert([{ ...term, company_id: cid }]).select()
    if (error) throw error
    return data[0]
  },

  async updateAttributeTerm(id, term) {
    const cid = await getCompanyId()
    const { data, error } = await supabase.from('attribute_terms').update(term).eq('id', id).eq('company_id', cid).select()
    if (error) throw error
    return data[0]
  },

  async deleteAttributeTerm(id) {
    const cid = await getCompanyId()
    const { error } = await supabase.from('attribute_terms').delete().eq('id', id).eq('company_id', cid)
    if (error) throw error
    return true
  },

  // ── Reviews ───────────────────────────────────
  async getReviews() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('reviews')
      .select('*, product:products(id, name)')
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ── Analytics Settings ────────────────────────
  async getAnalyticsSettings() {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('analytics_settings')
      .select('*')
      .eq('company_id', cid)
      .single()
    if (error) return { default_period: 30, revenue_goal: 0, low_stock_threshold: 5, sync_interval: 10 }
    return data
  },

  async updateAnalyticsSettings(settings) {
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('analytics_settings')
      .upsert({ company_id: cid, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'company_id' })
      .select()
    if (error) throw error
    return data[0]
  },

  // ── WooCommerce Credentials ───────────────────
  async getWooCredentials() {
    const cid = await getCompanyId()
    const { data } = await supabase
      .from('marketplace_credentials')
      .select('*')
      .eq('marketplace', 'woocommerce')
      .eq('company_id', cid)
      .limit(1)
    return data?.[0] || null
  },

  async upsertWooCredentials(creds) {
    const cid = await getCompanyId()
    const existing = await this.getWooCredentials()
    const payload = { marketplace: 'woocommerce', company_id: cid, ...creds, updated_at: new Date().toISOString() }

    if (existing?.id) {
      const { data, error } = await supabase
        .from('marketplace_credentials')
        .update(payload)
        .eq('id', existing.id)
        .select()
      if (error) throw error
      return data[0]
    }

    const { data, error } = await supabase
      .from('marketplace_credentials')
      .insert(payload)
      .select()

    if (error?.code === '23505') {
      // Conflito — atualiza pelo marketplace+company_id
      const { data: d2, error: e2 } = await supabase
        .from('marketplace_credentials')
        .update(payload)
        .eq('marketplace', 'woocommerce')
        .eq('company_id', cid)
        .select()
      if (e2) throw e2
      return d2[0]
    }

    if (error) throw error
    return data[0]
  },

  // ── Sync Logs ─────────────────────────────────
  async getSyncLogs({ page = 1, pageSize = 20, status, entity_type } = {}) {
    const cid = await getCompanyId()
    let query = supabase
      .from('marketplace_sync_log')
      .select('*', { count: 'exact' })
      .eq('company_id', cid)
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
    const cid = await getCompanyId()
    const [productsRes, categoriesRes, brandsRes, tagsRes] = await Promise.all([
      supabase.from('products').select('id, status, price, stock', { count: 'exact' }).eq('company_id', cid),
      supabase.from('categories').select('id', { count: 'exact' }).eq('company_id', cid),
      supabase.from('brands').select('id', { count: 'exact' }).eq('company_id', cid),
      supabase.from('tags').select('id', { count: 'exact' }).eq('company_id', cid),
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
    const cid = await getCompanyId()
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('company_id', cid)
      .order('order_index', { ascending: true })
    if (error) throw error
    return data || []
  },
}

// WooCommerce proxy via Supabase Edge Function
export async function wooProxy({ method = 'GET', endpoint, body, credentials, action, image_url, filename } = {}) {
  const { data, error } = await supabase.functions.invoke('woo-proxy', {
    body: { method, endpoint, body, credentials, action, image_url, filename }
  })
  if (error) throw new Error(error.message)
  if (data?.error) {
    const detail = data.details ? ` | WooCommerce: ${JSON.stringify(data.details)}` : ''
    throw new Error(data.error + detail)
  }
  return data
}

export async function wooUploadMedia(image_url, filename) {
  return wooProxy({ action: 'upload_media', image_url, filename })
}
