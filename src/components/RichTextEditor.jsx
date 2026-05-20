import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { useEffect, useCallback, useState } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link2, Link2Off, Maximize2, MousePointerClick, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CTA_COLORS = [
  { label: 'Verde',   value: '#16a34a' },
  { label: 'Azul',    value: '#2563eb' },
  { label: 'Preto',   value: '#111827' },
  { label: 'Laranja', value: '#ea580c' },
  { label: 'Roxo',    value: '#7c3aed' },
  { label: 'Vermelho',value: '#dc2626' },
]

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor, onSetLink, onOpenCta }) {
  if (!editor) return null
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito">
        <Bold className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico">
        <Italic className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado">
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista bullets">
        <List className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolbarBtn onClick={onSetLink} active={editor.isActive('link')} title="Adicionar link">
        <Link2 className="w-3.5 h-3.5" />
      </ToolbarBtn>
      {editor.isActive('link') && (
        <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} active={false} title="Remover link">
          <Link2Off className="w-3.5 h-3.5" />
        </ToolbarBtn>
      )}
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolbarBtn onClick={onOpenCta} active={false} title="Inserir botão CTA">
        <MousePointerClick className="w-3.5 h-3.5" />
      </ToolbarBtn>
    </div>
  )
}

function CtaForm({ onInsert, onClose }) {
  const [text, setText] = useState('Saiba mais')
  const [url, setUrl]   = useState('')
  const [color, setColor] = useState(CTA_COLORS[0].value)

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-lg space-y-3 text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-700">Inserir Botão</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Texto do botão</Label>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Ex: Saiba mais" className="h-8 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Link (URL)</Label>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Cor</Label>
        <div className="flex gap-2 flex-wrap">
          {CTA_COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${color === c.value ? 'border-gray-700 scale-110' : 'border-transparent'}`}
              style={{ background: c.value }}
            />
          ))}
        </div>
      </div>
      <div className="pt-1">
        <div className="mb-2 text-xs text-gray-400">Pré-visualização:</div>
        <a href="#" onClick={e => e.preventDefault()}
           style={{ background: color, color: '#fff', padding: '8px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', display: 'inline-block' }}>
          {text || 'Botão'}
        </a>
      </div>
      <Button size="sm" className="w-full h-8 text-xs" onClick={() => onInsert({ text, url, color })} disabled={!text}>
        Inserir botão
      </Button>
    </div>
  )
}

function useRichEditor(value, onChange) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) editor.commands.setContent(value || '', false)
  }, [value])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('URL do link:', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }, [editor])

  const insertCta = useCallback(({ text, url, color }) => {
    if (!editor) return
    editor.chain().focus().insertContent(
      `<p><a href="${url}" target="_blank" rel="noopener" style="display:inline-block;background:${color};color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">${text}</a></p>`
    ).run()
  }, [editor])

  return { editor, setLink, insertCta }
}

const editorClass = `[&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4 [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_p]:my-1 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic`

export default function RichTextEditor({ value, onChange }) {
  const { editor, setLink, insertCta } = useRichEditor(value, onChange)
  const [modalOpen, setModalOpen] = useState(false)
  const [ctaOpen, setCtaOpen]     = useState(false)

  return (
    <>
      {/* Compact editor */}
      <div className="border border-gray-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50">
          <Toolbar editor={editor} onSetLink={setLink} onOpenCta={() => setCtaOpen(v => !v)} />
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setModalOpen(true) }}
            title="Expandir editor"
            className="px-2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {ctaOpen && (
          <div className="absolute z-50 mt-1 ml-2">
            <CtaForm onInsert={({ text, url, color }) => { insertCta({ text, url, color }); setCtaOpen(false) }} onClose={() => setCtaOpen(false)} />
          </div>
        )}

        <EditorContent
          editor={editor}
          className={`px-3 py-2 text-sm text-gray-700 max-h-[100px] overflow-y-auto ${editorClass}`}
        />
      </div>

      {/* Expanded modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader className="shrink-0">
            <DialogTitle>Editar Descrição</DialogTitle>
          </DialogHeader>
          <ExpandedEditor value={value} onChange={onChange} />
        </DialogContent>
      </Dialog>
    </>
  )
}

function ExpandedEditor({ value, onChange }) {
  const { editor, setLink, insertCta } = useRichEditor(value, onChange)
  const [ctaOpen, setCtaOpen] = useState(false)

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-gray-200 rounded-md overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-gray-100 bg-gray-50">
        <Toolbar editor={editor} onSetLink={setLink} onOpenCta={() => setCtaOpen(v => !v)} />
      </div>

      {ctaOpen && (
        <div className="shrink-0 border-b border-gray-100 p-3 bg-white">
          <CtaForm onInsert={({ text, url, color }) => { insertCta({ text, url, color }); setCtaOpen(false) }} onClose={() => setCtaOpen(false)} />
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-700 ${editorClass}`}
      />
    </div>
  )
}
