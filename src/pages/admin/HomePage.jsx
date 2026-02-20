import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = 'https://dkvznmmiiiljyrkopiqx.supabase.co'
const BUCKET = 'product-images'

export default function HomePage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('home_photos')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      setPhotos(data || [])
    } catch (e) {
      showAlert('error', 'Erro ao carregar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploaded = []
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const path = `home/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
        if (upErr) throw upErr
        const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
        const { data, error: insErr } = await supabase
          .from('home_photos')
          .insert({ image_url: url, sort_order: photos.length + uploaded.length })
          .select().single()
        if (insErr) throw insErr
        uploaded.push(data)
      }
      setPhotos(prev => [...prev, ...uploaded])
      showAlert('success', `${uploaded.length} foto(s) adicionada(s)!`)
    } catch (e) {
      showAlert('error', 'Erro no upload: ' + e.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('home_photos').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setPhotos(prev => prev.filter(p => p.id !== deleteTarget.id))
      showAlert('success', 'Foto removida.')
      setDeleteTarget(null)
    } catch (e) {
      showAlert('error', 'Erro: ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  const move = async (index, direction) => {
    const arr = [...photos]
    const target = index + direction
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    setPhotos(arr)
    await Promise.all(arr.map((p, i) =>
      supabase.from('home_photos').update({ sort_order: i }).eq('id', p.id)
    ))
  }

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Home — Mosaico de Fotos</h1>
        <p className="text-sm text-gray-500">Gerencie as fotos exibidas no mosaico da página inicial do site</p>
      </div>

      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 160px)' }}>

        {/* Coluna esquerda — lista */}
        <div className="space-y-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Fotos ({photos.length})</p>
              <Button
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="gap-1.5"
              >
                {uploading ? (
                  <>Enviando...</>
                ) : (
                  <><Plus className="h-3.5 w-3.5" /> Adicionar fotos</>
                )}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleUpload(e.target.files)}
              />
            </CardHeader>
            <CardContent className="p-0">
              {photos.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm flex flex-col items-center gap-3">
                  <Image className="h-10 w-10 text-gray-200" />
                  <div>
                    <p className="font-medium">Nenhuma foto ainda</p>
                    <p className="text-xs mt-1">Clique em "Adicionar fotos" para fazer upload</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="flex items-center gap-3 p-3">
                      {/* Ordenação */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-20 p-0.5"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-20 p-0.5"
                          onClick={() => move(index, 1)}
                          disabled={index === photos.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Thumbnail */}
                      <img
                        src={photo.image_url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 truncate">#{index + 1} — {photo.image_url.split('/').pop()}</p>
                      </div>

                      {/* Excluir */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0"
                        onClick={() => setDeleteTarget(photo)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita — preview do mosaico */}
        <div className="sticky top-0">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-400 ml-2">Preview — Mosaico</span>
            </div>
            <div className="overflow-auto bg-white" style={{ height: 'calc(100% - 37px)' }}>
              {photos.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm flex-col gap-2">
                  <Image className="h-12 w-12" />
                  <span>Sem fotos</span>
                </div>
              ) : (
                <div style={{
                  columns: '3 80px',
                  columnGap: '6px',
                  padding: '6px',
                }}>
                  {photos.map(photo => (
                    <img
                      key={photo.id}
                      src={photo.image_url}
                      alt=""
                      style={{
                        width: '100%',
                        display: 'block',
                        borderRadius: '8px',
                        marginBottom: '6px',
                        objectFit: 'cover',
                        breakInside: 'avoid',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog delete */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Foto</DialogTitle></DialogHeader>
          {deleteTarget && (
            <div className="flex flex-col items-center gap-3">
              <img src={deleteTarget.image_url} alt="" className="w-32 h-32 object-cover rounded-lg" />
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Esta foto será removida do mosaico. Não pode ser desfeito.</AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
