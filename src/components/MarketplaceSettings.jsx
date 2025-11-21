import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store, Key, Check, X, AlertCircle, Save, Eye, EyeOff, Zap, Loader } from 'lucide-react'

const MARKETPLACES = [
  { id: 'mercado_livre', name: 'Mercado Livre', color: 'yellow', icon: '🛒' },
  { id: 'shopee', name: 'Shopee', color: 'orange', icon: '🛍️' },
  { id: 'tiktok', name: 'TikTok Shop', color: 'pink', icon: '🎵' },
  { id: 'amazon', name: 'Amazon', color: 'blue', icon: '📦' },
  { id: 'woocommerce', name: 'WooCommerce', color: 'purple', icon: '🌐' }
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

      const payload = {
        marketplace,
        is_active: cred.is_active || false,
        client_id: cred.client_id || null,
        client_secret: cred.client_secret || null,
        access_token: cred.access_token || null,
        refresh_token: cred.refresh_token || null,
        store_url: cred.store_url || null,
        seller_id: cred.seller_id || null,
        shop_id: cred.shop_id || null,
        auto_sync_stock: cred.auto_sync_stock !== false,
        auto_sync_price: cred.auto_sync_price !== false,
        auto_sync_products: cred.auto_sync_products || false
      }

      const { error } = await supabase
        .from('marketplace_credentials')
        .upsert(payload, { onConflict: 'marketplace' })

      if (error) throw error

      setMessage({ type: 'success', text: 'Credenciais salvas com sucesso!' })
      setTimeout(() => setMessage(null), 3000)

      await loadCredentials()

    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar credenciais: ' + error.message })
    } finally {
      setSaving(null)
    }
  }

  async function testConnection(marketplace) {
    setTesting(marketplace)
    setTestResults(prev => ({ ...prev, [marketplace]: null }))

    try {
      const cred = credentials[marketplace] || {}

      // Mapear campos para o formato esperado pela Edge Function
      const credPayload = {
        client_id: cred.client_id,
        client_secret: cred.client_secret,
        access_token: cred.access_token,
        refresh_token: cred.refresh_token,
        store_url: cred.store_url,
        seller_id: cred.seller_id,
        shop_id: cred.shop_id,
        partner_id: cred.client_id, // Shopee usa partner_id
        partner_key: cred.client_secret, // Shopee usa partner_key
        app_key: cred.client_id, // TikTok usa app_key
        app_secret: cred.client_secret // TikTok usa app_secret
      }

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
        setMessage({ type: 'success', text: `✅ ${data.message}` })
      } else {
        setMessage({ type: 'error', text: `❌ ${data.error}` })
      }

      setTimeout(() => setMessage(null), 5000)

    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      setTestResults(prev => ({
        ...prev,
        [marketplace]: { success: false, error: error.message }
      }))
      setMessage({ type: 'error', text: 'Erro ao testar conexão: ' + error.message })
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
      <div className={`p-6 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Carregando configurações...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-700'
            : darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
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
            className={`${darkMode ? 'bg-[#202020] border-gray-800' : 'bg-white border-gray-200'} rounded-xl border-2 p-6 shadow-sm`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{marketplace.icon}</span>
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {marketplace.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isActive ? '✅ Ativo' : '⚪ Inativo'}
                  </p>
                </div>
              </div>

              {/* Toggle ativo */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ativar
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => updateCredential(marketplace.id, 'is_active', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>

            {/* Campos de credenciais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Client ID */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Client ID / App Key
                </label>
                <input
                  type="text"
                  value={cred.client_id || ''}
                  onChange={(e) => updateCredential(marketplace.id, 'client_id', e.target.value)}
                  placeholder="Insira o Client ID"
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode
                      ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:border-yellow-500`}
                />
              </div>

              {/* Client Secret */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Client Secret / App Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={cred.client_secret || ''}
                    onChange={(e) => updateCredential(marketplace.id, 'client_secret', e.target.value)}
                    placeholder="Insira o Client Secret"
                    className={`w-full px-4 py-2 pr-12 rounded-lg border-2 ${
                      darkMode
                        ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-yellow-500`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecret(marketplace.id)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Access Token */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Access Token
                </label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={cred.access_token || ''}
                  onChange={(e) => updateCredential(marketplace.id, 'access_token', e.target.value)}
                  placeholder="Token de acesso"
                  className={`w-full px-4 py-2 rounded-lg border-2 ${
                    darkMode
                      ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:border-yellow-500`}
                />
              </div>

              {/* Campos específicos */}
              {marketplace.id === 'woocommerce' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    URL da Loja
                  </label>
                  <input
                    type="url"
                    value={cred.store_url || ''}
                    onChange={(e) => updateCredential(marketplace.id, 'store_url', e.target.value)}
                    placeholder="https://minhaloja.com"
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode
                        ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-yellow-500`}
                  />
                </div>
              )}

              {(marketplace.id === 'shopee' || marketplace.id === 'tiktok') && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Shop ID
                  </label>
                  <input
                    type="text"
                    value={cred.shop_id || ''}
                    onChange={(e) => updateCredential(marketplace.id, 'shop_id', e.target.value)}
                    placeholder="ID da loja"
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode
                        ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-yellow-500`}
                  />
                </div>
              )}

              {marketplace.id === 'amazon' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Seller ID
                  </label>
                  <input
                    type="text"
                    value={cred.seller_id || ''}
                    onChange={(e) => updateCredential(marketplace.id, 'seller_id', e.target.value)}
                    placeholder="ID do vendedor"
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      darkMode
                        ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-yellow-500`}
                  />
                </div>
              )}
            </div>

            {/* Opções de sincronização */}
            <div className={`border-t-2 pt-4 mb-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sincronização Automática
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cred.auto_sync_stock !== false}
                    onChange={(e) => updateCredential(marketplace.id, 'auto_sync_stock', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sincronizar Estoque
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cred.auto_sync_price !== false}
                    onChange={(e) => updateCredential(marketplace.id, 'auto_sync_price', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sincronizar Preço
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cred.auto_sync_products || false}
                    onChange={(e) => updateCredential(marketplace.id, 'auto_sync_products', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sincronizar Produtos
                  </span>
                </label>
              </div>
            </div>

            {/* Resultado do Teste */}
            {testResults[marketplace.id] && (
              <div className={`p-3 rounded-lg flex items-start gap-3 ${
                testResults[marketplace.id].success
                  ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-700'
                  : darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-700'
              }`}>
                {testResults[marketplace.id].success ? (
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {testResults[marketplace.id].success ? 'Conexão bem-sucedida!' : 'Erro na conexão'}
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    {testResults[marketplace.id].message || testResults[marketplace.id].error}
                  </p>
                  {testResults[marketplace.id].userData && (
                    <pre className="text-xs mt-2 opacity-75">
                      {JSON.stringify(testResults[marketplace.id].userData, null, 2)}
                    </pre>
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
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-5 h-5" />
                {saving === marketplace.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
