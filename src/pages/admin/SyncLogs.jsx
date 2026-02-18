import React, { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'

const STATUS_CONFIG = {
  success: { label: 'Sucesso', variant: 'success', icon: CheckCircle },
  error: { label: 'Erro', variant: 'destructive', icon: AlertCircle },
  pending: { label: 'Pendente', variant: 'warning', icon: Clock },
  retrying: { label: 'Tentando', variant: 'info', icon: RefreshCw },
}

const OP_LABELS = {
  create: 'Criar', update: 'Atualizar', delete: 'Excluir',
  sync_stock: 'Sync Estoque', sync_price: 'Sync Preço',
  webhook_received: 'Webhook', order_webhook: 'Pedido',
}

const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

export default function SyncLogs() {
  const [logs, setLogs] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded, setExpanded] = useState({})
  const [alert, setAlert] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const result = await api.getSyncLogs({ page, pageSize: 20, status: filterStatus || undefined })
      setLogs(result.data)
      setCount(result.count)
    } catch (e) {
      setAlert({ type: 'error', message: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, filterStatus])

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Logs de Sincronização</h1>
          <p className="text-sm text-gray-500">{count} operações registradas</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      {alert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Select value={filterStatus || 'all'} onValueChange={v => { setFilterStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum log encontrado</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-6" />
                      <TableHead>Operação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>HTTP</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => {
                      const status = STATUS_CONFIG[log.status] || { label: log.status, variant: 'secondary', icon: Clock }
                      const StatusIcon = status.icon
                      const hasDetails = log.error_message || log.request_payload || log.response_payload
                      return (
                        <React.Fragment key={log.id}>
                          <TableRow className={hasDetails ? 'cursor-pointer' : ''} onClick={() => hasDetails && toggle(log.id)}>
                            <TableCell className="w-6">
                              {hasDetails && (expanded[log.id] ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{OP_LABELS[log.operation_type] || log.operation_type}</span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {log.entity_type && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-1">{log.entity_type}</span>}
                              {log.marketplace_product_id || log.entity_id || `Produto #${log.local_product_id}` || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-400">{log.http_status_code || '—'}</TableCell>
                            <TableCell className="text-xs text-gray-400">{fmtDate(log.created_at)}</TableCell>
                          </TableRow>
                          {expanded[log.id] && (
                            <TableRow key={`${log.id}-detail`}>
                              <TableCell colSpan={6} className="bg-gray-50 p-4">
                                <div className="space-y-3">
                                  {log.error_message && (
                                    <div>
                                      <p className="text-xs font-medium text-red-600 mb-1">Erro</p>
                                      <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{log.error_message}</p>
                                    </div>
                                  )}
                                  {log.request_payload && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 mb-1">Request</p>
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">{JSON.stringify(log.request_payload, null, 2)}</pre>
                                    </div>
                                  )}
                                  {log.response_payload && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 mb-1">Response</p>
                                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">{JSON.stringify(log.response_payload, null, 2)}</pre>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {logs.map(log => {
                  const status = STATUS_CONFIG[log.status] || { label: log.status, variant: 'secondary', icon: Clock }
                  const StatusIcon = status.icon
                  const hasDetails = log.error_message || log.request_payload || log.response_payload
                  return (
                    <div key={log.id}>
                      <div
                        className={`p-4 ${hasDetails ? 'cursor-pointer' : ''}`}
                        onClick={() => hasDetails && toggle(log.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{OP_LABELS[log.operation_type] || log.operation_type}</span>
                          <Badge variant={status.variant} className="gap-1 text-xs">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {log.entity_type && <span className="bg-gray-100 px-1 py-0.5 rounded mr-1">{log.entity_type}</span>}
                            {log.marketplace_product_id || log.entity_id || (log.local_product_id ? `#${log.local_product_id}` : '—')}
                            {log.http_status_code && <span className="ml-2 text-gray-400">HTTP {log.http_status_code}</span>}
                          </p>
                          <p className="text-xs text-gray-400">{fmtDate(log.created_at)}</p>
                        </div>
                        {hasDetails && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {expanded[log.id] ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                            <span className="text-xs text-gray-400">Detalhes</span>
                          </div>
                        )}
                      </div>
                      {expanded[log.id] && (
                        <div className="px-4 pb-4 bg-gray-50 space-y-3">
                          {log.error_message && (
                            <div>
                              <p className="text-xs font-medium text-red-600 mb-1">Erro</p>
                              <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{log.error_message}</p>
                            </div>
                          )}
                          {log.request_payload && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">Request</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">{JSON.stringify(log.request_payload, null, 2)}</pre>
                            </div>
                          )}
                          {log.response_payload && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-1">Response</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32">{JSON.stringify(log.response_payload, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {count > 20 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>Anterior</Button>
          <span className="text-sm text-gray-500 px-2">Página {page} de {Math.ceil(count / 20)}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(count / 20) || loading}>Próxima</Button>
        </div>
      )}
    </div>
  )
}
