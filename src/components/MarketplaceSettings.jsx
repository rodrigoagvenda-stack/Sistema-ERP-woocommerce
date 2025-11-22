import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store, Check, X, AlertCircle, Save, Eye, EyeOff, Zap, Loader, ShoppingCart, ShoppingBag, Video, Package, ExternalLink } from 'lucide-react'

const MARKETPLACES = [
  {
    id: 'mercado_livre',
    name: 'Mercado Livre',
    color: 'yellow',
    Icon: ShoppingCart,
    docsUrl: 'https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: false }
    ]
  },
  {
    id: 'shopee',
    name: 'Shopee',
    color: 'orange',
    Icon: ShoppingBag,
    docsUrl: 'https://open.shopee.com/documents',
    fields: [
      { key: 'partner_id', label: 'Partner ID', type: 'text', required: true },
      { key: 'partner_key', label: 'Partner Key', type: 'password', required: true },
      { key: 'shop_id', label: 'Shop ID', type: 'text', required: true }
    ]
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    color: 'pink',
    Icon: Video,
    docsUrl: 'https://partner.tiktokshop.com/doc',
    fields: [
      { key: 'app_key', label: 'App Key', type: 'text', required: true },
      { key: 'app_secret', label: 'App Secret', type: 'password', required: true },
      { key: 'shop_id', label: 'Shop ID', type: 'text', required: false }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon (LWA)',
    color: 'blue',
    Icon: Package,
    docsUrl: 'https://developer-docs.amazon.com/sp-api/',
    fields: [
      { key: 'client_id', label: 'LWA Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'LWA Client Secret', type: 'password', required: true },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: true },
      { key: 'seller_id', label: 'Seller ID', type: 'text', required: false }
    ]
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    color: 'purple',
    Icon: Store,
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    fields: [
      { key: 'store_url', label: 'URL da Loja', type: 'url', required: true },
      { key: 'consumer_key', label: 'Consumer Key', type: 'text', required: true },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true }
    ]
  }
]

export default function MarketplaceSettings({ darkMode }) {
  const [credentials, setCredentials] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [testing, setTesting] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [showSecrets, setShowSecrets] = useState({})
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadCredentials()
  }, [])

  async function loadCredentials() {
    try {
      const { data, error } = await supabase
        .from('marketplace_credentials')
        .select('*')

      if (error) throw error

      const credMap = {}
      data?.forEach(cred => {
        credMap[cred.marketplace] = cred
      })

      setCredentials(credMap)
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveCredentials(marketplace) {
    setSaving(marketplace)
    setMessage(null)

    try {
      const cred = credentials[marketplace] || {}

      // Criar payload com apenas os campos específicos do marketplace
      const marketplaceConfig = MARKETPLACES.find(m => m.id === marketplace)
      const payload = {
        marketplace,
        is_active: cred.is_active || false,
        auto_sync_stock: cred.auto_sync_stock !== false,
        auto_sync_price: cred.auto_sync_price !== false,
        auto_sync_products: cred.auto_sync_products || false
      }

      // Adicionar campos específicos do marketplace
      marketplaceConfig.fields.forEach(field => {
        payload[field.key] = cred[field.key] || null
      })

      const { error } = await supabase
        .from('marketplace_credentials')
        .upsert(payload, { onConflict: 'marketplace' })

      if (error) throw error

      setMessage({ type: 'success', text: `✅ Credenciais do ${marketplaceConfig.name} salvas com sucesso!` })
      setTimeout(() => setMessage(null), 3000)

      await loadCredentials()

    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: '❌ Erro ao salvar credenciais: ' + error.message })
    } finally {
      setSaving(null)
    }
  }

  async function testConnection(marketplace) {
    setTesting(marketplace)
    setTestResults(prev => ({ ...prev, [marketplace]: null }))

    try {
      const cred = credentials[marketplace] || {}
      const marketplaceConfig = MARKETPLACES.find(m => m.id === marketplace)

      // Criar payload com campos específicos
      const credPayload = {}
      marketplaceConfig.fields.forEach(field => {
        credPayload[field.key] = cred[field.key]
      })

      const { data, error } = await supabase.functions.invoke('test-marketplace-connection', {
        body: {
          marketplace,
          credentials: credPayload
        }
      })

      if (error) throw error

      setTestResults(prev => ({
        ...prev,
        [marketplace]: data
      }))

      if (data.success) {
        setMessage({ type: 'success', text: '✅ ' + data.message })
      } else {
        setMessage({ type: 'error', text: '❌ ' + data.error })
      }

      setTimeout(() => setMessage(null), 5000)

    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      setTestResults(prev => ({
        ...prev,
        [marketplace]: { success: false, error: error.message }
      }))
      setMessage({ type: 'error', text: '❌ Erro ao testar conexão: ' + error.message })
    } finally {
      setTesting(null)
    }
  }

  function updateCredential(marketplace, field, value) {
    setCredentials(prev => ({
      ...prev,
      [marketplace]: {
        ...prev[marketplace],
        [field]: value
      }
    }))
  }

  function toggleSecret(marketplace) {
    setShowSecrets(prev => ({
      ...prev,
      [marketplace]: !prev[marketplace]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 shadow-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-2 border-green-200'
            : 'bg-red-50 text-red-700 border-2 border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Listagem de marketplaces */}
      {MARKETPLACES.map(marketplace => {
        const cred = credentials[marketplace.id] || {}
        const isActive = cred.is_active || false
        const showSecret = showSecrets[marketplace.id] || false

        return (
          <div
            key={marketplace.id}
            className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  marketplace.color === 'yellow' ? 'bg-yellow-100' :
                  marketplace.color === 'orange' ? 'bg-orange-100' :
                  marketplace.color === 'pink' ? 'bg-pink-100' :
                  marketplace.color === 'blue' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  <marketplace.Icon className={`w-6 h-6 ${
                    marketplace.color === 'yellow' ? 'text-yellow-600' :
                    marketplace.color === 'orange' ? 'text-orange-600' :
                    marketplace.color === 'pink' ? 'text-pink-600' :
                    marketplace.color === 'blue' ? 'text-blue-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {marketplace.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600">
                      {isActive ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-500" /> Ativo
                        </span>
                      ) : (
                        <span className="text-gray-400">Inativo</span>
                      )}
                    </p>
                    <span className="text-sm text-gray-400">•</span>
                    <a
                      href={marketplace.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Documentação <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Toggle ativo */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">
                  Ativar
                </span>
                <button
                  type="button"
                  onClick={() => updateCredential(marketplace.id, 'is_active', !isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                    isActive ? 'bg-yellow-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Campos de credenciais específicos do marketplace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {marketplace.fields.map(field => (
                <div key={field.key} className={field.key === 'store_url' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={field.type === 'password' && !showSecret ? 'password' : 'text'}
                      value={cred[field.key] || ''}
                      onChange={(e) => updateCredential(marketplace.id, field.key, e.target.value)}
                      placeholder={`Insira o ${field.label}`}
                      className="w-full px-4 py-2.5 pr-12 rounded-lg border-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-colors"
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => toggleSecret(marketplace.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Opções de sincronização */}
            <div className="border-t-2 border-gray-200 pt-4 mb-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">
                Sincronização Automática
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cred.auto_sync_stock !== false}
                    onChange={(e) => updateCredential(marketplace.id, 'auto_sync_stock', e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">
                    Sincronizar Estoque
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cred.auto_sync_price !== false}
                    onChange={(e) => updateCredential(marketplace.id, 'auto_sync_price', e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">
                    Sincronizar Preço
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cred.auto_sync_products || false}
                    onChange={(e) => updateCredential(marketplace.id, 'auto_sync_products', e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">
                    Sincronizar Produtos
                  </span>
                </label>
              </div>
            </div>

            {/* Resultado do Teste */}
            {testResults[marketplace.id] && (
              <div className={`p-3 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-3 mb-4 border-2 ${
                testResults[marketplace.id].success
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {testResults[marketplace.id].success ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium">
                    {testResults[marketplace.id].success ? 'Conexão bem-sucedida!' : 'Erro na conexão'}
                  </p>
                  <p className="text-xs mt-1 opacity-90 break-words">
                    {testResults[marketplace.id].message || testResults[marketplace.id].error}
                  </p>
                  {testResults[marketplace.id].userData && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(testResults[marketplace.id].userData).map(([key, value]) => (
                        <div key={key} className="text-xs opacity-75 bg-white/50 px-2 py-1 rounded break-words">
                          <span className="font-semibold">{key}:</span>{' '}
                          <span className="break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Botão Testar Conexão */}
              <button
                onClick={() => testConnection(marketplace.id)}
                disabled={testing === marketplace.id || saving === marketplace.id}
                className="px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {testing === marketplace.id ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Testar Conexão
                  </>
                )}
              </button>

              {/* Botão Salvar */}
              <button
                onClick={() => saveCredentials(marketplace.id)}
                disabled={saving === marketplace.id || testing === marketplace.id}
                className="px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-black disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {saving === marketplace.id ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        )
      })}

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Sobre as Integrações
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Campos obrigatórios marcados com *</strong> são necessários para estabelecer a conexão.
          </p>
          <p>
            Cada marketplace possui sua própria estrutura de API. Consulte a documentação oficial (link acima)
            para obter as credenciais corretas.
          </p>
          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
            <li><strong>Mercado Livre:</strong> Obtenha Client ID e Secret no Developers Portal</li>
            <li><strong>Shopee:</strong> Use Partner ID e Partner Key do Seller Center</li>
            <li><strong>TikTok Shop:</strong> Cadastre seu App Key no Partner Portal</li>
            <li><strong>Amazon:</strong> Configure LWA (Login with Amazon) no Seller Central</li>
            <li><strong>WooCommerce:</strong> Gere Consumer Keys em WooCommerce → Configurações → Avançado → API REST</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
