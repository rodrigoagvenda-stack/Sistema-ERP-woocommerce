import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Clock, Check, X, AlertCircle, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react'

const MARKETPLACES = {
  mercado_livre: { name: 'Mercado Livre', icon: '🛒' },
  shopee: { name: 'Shopee', icon: '🛍️' },
  tiktok: { name: 'TikTok Shop', icon: '🎵' },
  amazon: { name: 'Amazon', icon: '📦' },
  woocommerce: { name: 'WooCommerce', icon: '🌐' }
}

const OPERATION_LABELS = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Remoção',
  sync_stock: 'Sinc. Estoque',
  sync_price: 'Sinc. Preço',
  webhook_received: 'Webhook',
  order_webhook: 'Pedido'
}

export default function MarketplaceSyncLogs({ darkMode }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ marketplace: 'all', status: 'all' })
  const [expandedLog, setExpandedLog] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const logsPerPage = 20

  useEffect(() => {
    loadLogs()
  }, [filter, page])

  async function loadLogs() {
    setLoading(true)
    try {
      let query = supabase
        .from('marketplace_sync_log')
        .select('*, products(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1)

      if (filter.marketplace !== 'all') {
        query = query.eq('marketplace', filter.marketplace)
      }

      if (filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }

      const { data, error, count } = await query

      if (error) throw error

      setLogs(data || [])
      setHasMore(count > page * logsPerPage)

    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />
      case 'error':
        return <X className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'retrying':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  function getStatusBadge(status) {
    const colors = {
      success: darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
      error: darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
      pending: darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
      retrying: darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
    }

    return (
      <span className={`text-xs px-2 py-1 rounded font-medium ${colors[status] || colors.pending}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  function toggleExpanded(logId) {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className={`p-4 rounded-lg border-2 ${
        darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />

          <select
            value={filter.marketplace}
            onChange={(e) => setFilter({ ...filter, marketplace: e.target.value })}
            className={`px-4 py-2 rounded-lg border-2 ${
              darkMode
                ? 'bg-[#202020] border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:border-yellow-500`}
          >
            <option value="all">Todos os marketplaces</option>
            {Object.entries(MARKETPLACES).map(([id, mp]) => (
              <option key={id} value={id}>{mp.icon} {mp.name}</option>
            ))}
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className={`px-4 py-2 rounded-lg border-2 ${
              darkMode
                ? 'bg-[#202020] border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:border-yellow-500`}
          >
            <option value="all">Todos os status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="pending">Pendente</option>
            <option value="retrying">Tentando novamente</option>
          </select>

          <button
            onClick={() => loadLogs()}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              darkMode
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            } transition-colors font-medium`}
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista de Logs */}
      {loading ? (
        <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Carregando logs...
        </div>
      ) : logs.length === 0 ? (
        <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const marketplace = MARKETPLACES[log.marketplace]
            const isExpanded = expandedLog === log.id

            return (
              <div
                key={log.id}
                className={`rounded-lg border-2 overflow-hidden transition-all ${
                  darkMode
                    ? 'bg-[#202020] border-gray-800 hover:border-gray-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header do Log */}
                <div
                  onClick={() => toggleExpanded(log.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(log.status)}

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{marketplace?.icon}</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {marketplace?.name || log.marketplace}
                          </span>
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            • {OPERATION_LABELS[log.operation_type] || log.operation_type}
                          </span>
                          {log.products?.name && (
                            <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              • {log.products.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          {getStatusBadge(log.status)}
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                          {log.http_status_code && (
                            <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                              HTTP {log.http_status_code}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {log.error_message && !isExpanded && (
                    <div className={`mt-2 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {log.error_message}
                    </div>
                  )}
                </div>

                {/* Detalhes Expandidos */}
                {isExpanded && (
                  <div className={`px-4 pb-4 border-t-2 pt-4 ${
                    darkMode ? 'border-gray-800' : 'border-gray-200'
                  }`}>
                    {log.error_message && (
                      <div className={`mb-3 p-3 rounded ${
                        darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
                      }`}>
                        <strong className="block mb-1">Erro:</strong>
                        <code className="text-sm">{log.error_message}</code>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.request_payload && (
                        <div>
                          <h5 className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Request Payload
                          </h5>
                          <pre className={`text-xs p-3 rounded overflow-auto max-h-64 ${
                            darkMode ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {JSON.stringify(log.request_payload, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.response_payload && (
                        <div>
                          <h5 className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Response Payload
                          </h5>
                          <pre className={`text-xs p-3 rounded overflow-auto max-h-64 ${
                            darkMode ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {JSON.stringify(log.response_payload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {log.retry_count > 0 && (
                      <div className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tentativas: {log.retry_count} / {log.max_retries}
                        {log.next_retry_at && (
                          <span> • Próxima tentativa: {new Date(log.next_retry_at).toLocaleString('pt-BR')}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50'
            } transition-colors disabled:cursor-not-allowed`}
          >
            Anterior
          </button>

          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Página {page}
          </span>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className={`px-4 py-2 rounded ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50'
            } transition-colors disabled:cursor-not-allowed`}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
