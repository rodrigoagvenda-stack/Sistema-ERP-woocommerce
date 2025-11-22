import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, Check, X, AlertCircle, Loader } from 'lucide-react'

const MARKETPLACES = [
  { id: 'mercado_livre', name: 'Mercado Livre', icon: '🛒', color: 'yellow' },
  { id: 'shopee', name: 'Shopee', icon: '🛍️', color: 'orange' },
  { id: 'tiktok', name: 'TikTok Shop', icon: '🎵', color: 'pink' },
  { id: 'amazon', name: 'Amazon', icon: '📦', color: 'blue' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🌐', color: 'purple' }
]

export default function ProductMarketplaces({ productId, darkMode }) {
  const [marketplaceStatus, setMarketplaceStatus] = useState({})
  const [activeMarketplaces, setActiveMarketplaces] = useState([])
  const [syncing, setSyncing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorNotification, setErrorNotification] = useState(null)

  useEffect(() => {
    loadMarketplaceStatus()
    loadActiveMarketplaces()
  }, [productId])

  async function loadActiveMarketplaces() {
    try {
      const { data } = await supabase
        .from('marketplace_credentials')
        .select('marketplace, is_active')
        .eq('is_active', true)

      setActiveMarketplaces(data?.map(m => m.marketplace) || [])
    } catch (error) {
      console.error('Erro ao carregar marketplaces ativos:', error)
    }
  }

  async function loadMarketplaceStatus() {
    if (!productId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('local_product_id', productId)

      if (error) throw error

      const statusMap = {}
      data?.forEach(mp => {
        statusMap[mp.marketplace] = {
          isPublished: mp.is_published,
          syncStatus: mp.sync_status,
          lastSync: mp.last_sync_at,
          marketplaceId: mp.marketplace_product_id,
          marketplaceUrl: mp.marketplace_url,
          lastError: mp.last_error
        }
      })

      setMarketplaceStatus(statusMap)
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function syncToMarketplace(marketplace) {
    if (!productId) {
      alert('Salve o produto antes de sincronizar com marketplaces')
      return
    }

    setSyncing(marketplace)

    try {
      // Chamar Edge Function de sincronização
      const { data, error } = await supabase.functions.invoke('sync-to-marketplaces', {
        body: {
          productId,
          marketplaces: [marketplace]
        }
      })

      if (error) throw error

      const result = data.results?.find(r => r.marketplace === marketplace)

      if (result?.success) {
        // Atualizar status local
        setMarketplaceStatus(prev => ({
          ...prev,
          [marketplace]: {
            isPublished: true,
            syncStatus: 'synced',
            lastSync: new Date().toISOString(),
            marketplaceId: result.marketplaceId
          }
        }))

        alert(`✅ Produto publicado no ${MARKETPLACES.find(m => m.id === marketplace)?.name}!`)
      } else {
        throw new Error(result?.error || 'Erro desconhecido')
      }

    } catch (error) {
      console.error('Erro ao sincronizar:', error)

      const marketplaceName = MARKETPLACES.find(m => m.id === marketplace)?.name || marketplace

      // Atualizar estado com o erro para mostrar na UI
      setMarketplaceStatus(prev => ({
        ...prev,
        [marketplace]: {
          ...prev[marketplace],
          syncStatus: 'error',
          lastError: error.message
        }
      }))

      // Mostrar notificação de erro visível ao usuário
      setErrorNotification({
        marketplace: marketplaceName,
        message: error.message
      })

      // Auto-remover notificação após 10 segundos
      setTimeout(() => setErrorNotification(null), 10000)
    } finally {
      setSyncing(null)
      loadMarketplaceStatus()
    }
  }

  async function toggleMarketplace(marketplace, enable) {
    if (!productId) return

    try {
      if (enable) {
        // Publicar no marketplace
        await syncToMarketplace(marketplace)
      } else {
        // Despublicar (marcar como inativo)
        await supabase
          .from('marketplace_products')
          .update({ is_active: false, is_published: false })
          .eq('local_product_id', productId)
          .eq('marketplace', marketplace)

        setMarketplaceStatus(prev => ({
          ...prev,
          [marketplace]: {
            ...prev[marketplace],
            isPublished: false
          }
        }))
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  function getStatusBadge(marketplace) {
    const status = marketplaceStatus[marketplace]

    if (!status || !status.isPublished) {
      return (
        <span className={`text-xs px-2 py-1 rounded ${
          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
        }`}>
          Não publicado
        </span>
      )
    }

    if (status.syncStatus === 'synced') {
      return (
        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
          darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
        }`}>
          <Check className="w-3 h-3" />
          Publicado
        </span>
      )
    }

    if (status.syncStatus === 'error') {
      return (
        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 font-bold border-2 ${
          darkMode ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-red-100 border-red-500 text-red-700'
        }`} title={status.lastError}>
          <X className="w-3 h-3" />
          Erro na sincronização
        </span>
      )
    }

    return (
      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
        darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
      }`}>
        <Loader className="w-3 h-3 animate-spin" />
        Pendente
      </span>
    )
  }

  if (loading) {
    return (
      <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
        Carregando integrações...
      </div>
    )
  }

  if (activeMarketplaces.length === 0) {
    return (
      <div className={`p-4 rounded-lg border-2 ${
        darkMode ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-yellow-50 border-yellow-300 text-yellow-800'
      }`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Nenhum marketplace configurado</p>
            <p className="text-sm opacity-80">
              Configure as credenciais dos marketplaces nas Configurações para começar a sincronizar produtos.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Publicar em Marketplaces
        </h4>
        {productId && (
          <button
            onClick={loadMarketplaceStatus}
            className={`text-xs px-3 py-1 rounded flex items-center gap-1 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } transition-colors`}
          >
            <RefreshCw className="w-3 h-3" />
            Atualizar
          </button>
        )}
      </div>

      {/* Notificação de erro visível */}
      {errorNotification && (
        <div className={`p-4 rounded-lg border-2 animate-pulse ${
          darkMode ? 'bg-red-900/30 border-red-500 text-red-300' : 'bg-red-50 border-red-500 text-red-900'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-lg mb-2">
                  ❌ Erro ao sincronizar com {errorNotification.marketplace}
                </h5>
                <button
                  onClick={() => setErrorNotification(null)}
                  className={`text-xl ${darkMode ? 'hover:text-red-200' : 'hover:text-red-700'}`}
                >
                  ✕
                </button>
              </div>
              <div className={`p-3 rounded text-sm font-mono whitespace-pre-wrap ${
                darkMode ? 'bg-black/40' : 'bg-white/60'
              }`}>
                {errorNotification.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {MARKETPLACES.filter(m => activeMarketplaces.includes(m.id)).map(marketplace => {
        const status = marketplaceStatus[marketplace.id]
        const isPublished = status?.isPublished || false
        const isSyncing = syncing === marketplace.id

        return (
          <div
            key={marketplace.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              darkMode
                ? 'bg-[#1a1a1a] border-gray-800 hover:border-gray-700'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{marketplace.icon}</span>
                <div className="flex-1">
                  <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {marketplace.name}
                  </h5>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(marketplace.id)}
                    {status?.lastSync && (
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Última sinc: {new Date(status.lastSync).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {isPublished && status?.marketplaceUrl && (
                  <a
                    href={status.marketplaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs px-3 py-1 rounded text-center ${
                      darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    } transition-colors`}
                  >
                    Ver no marketplace
                  </a>
                )}

                <button
                  onClick={() => syncToMarketplace(marketplace.id)}
                  disabled={isSyncing || !productId}
                  className={`px-4 py-2 rounded font-medium transition-all flex items-center justify-center gap-2 ${
                    isPublished
                      ? darkMode
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      : darkMode
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSyncing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : isPublished ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Atualizar
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Publicar
                    </>
                  )}
                </button>
              </div>
            </div>

            {status?.lastError && (
              <div className={`mt-3 p-3 rounded-lg border-2 ${
                darkMode ? 'bg-red-900/20 border-red-500/50 text-red-300' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-sm">Detalhes do erro:</span>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed overflow-x-auto">
                  {status.lastError}
                </pre>
              </div>
            )}
          </div>
        )
      })}

      {!productId && (
        <div className={`p-3 rounded text-sm text-center ${
          darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
        }`}>
          💡 Salve o produto primeiro para poder publicá-lo nos marketplaces
        </div>
      )}
    </div>
  )
}
