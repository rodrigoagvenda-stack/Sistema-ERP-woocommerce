import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { useEffect, useCallback, useState } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link2, Link2Off, Maximize2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor, onSetLink }) {
  if (!editor) return null
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">
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

  return { editor, setLink }
}

const editorClass = `[&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4 [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_p]:my-1 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic`

export default function RichTextEditor({ value, onChange }) {
  const { editor, setLink } = useRichEditor(value, onChange)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="border border-gray-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50">
          <Toolbar editor={editor} onSetLink={setLink} />
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setModalOpen(true) }}
            title="Expandir editor"
            className="px-2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <EditorContent
          editor={editor}
          className={`px-3 py-2 text-sm text-gray-700 max-h-[100px] overflow-y-auto ${editorClass}`}
        />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl flex flex-col" style={{ height: '80vh' }}>
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
  const { editor, setLink } = useRichEditor(value, onChange)

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-gray-200 rounded-md overflow-hidden">
      <div className="shrink-0 border-b border-gray-100 bg-gray-50">
        <Toolbar editor={editor} onSetLink={setLink} />
      </div>
      <EditorContent
        editor={editor}
        className={`flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-700 ${editorClass}`}
      />
    </div>
  )
}
