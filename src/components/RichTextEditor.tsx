'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading2, Link2, Code, Undo, Redo
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'

interface NonSSRWrapperProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: NonSSRWrapperProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-violet-600 underline font-black cursor-pointer hover:text-violet-800',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Ketikkan sesuatu di sini...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }: any) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[150px] font-medium leading-relaxed prose-headings:font-black prose-a:text-violet-600',
      },
    },
    immediatelyRender: false, // Penting di Next.js 15 biar gak hydration mismatch
  })

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-col border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a] bg-white overflow-hidden transition-all focus-within:shadow-[6px_6px_0px_#0f172a] focus-within:-translate-y-1">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border-b-4 border-slate-900">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          className="data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=on]:border-transparent bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          className="data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=on]:border-transparent bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          className="data-[state=on]:bg-slate-900 data-[state=on]:text-white data-[state=on]:border-transparent bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="data-[state=on]:bg-violet-400 data-[state=on]:text-slate-900 data-[state=on]:border-violet-600 bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg font-black"
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          className="data-[state=on]:bg-emerald-300 data-[state=on]:text-slate-900 data-[state=on]:border-emerald-500 bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          className="data-[state=on]:bg-emerald-300 data-[state=on]:text-slate-900 data-[state=on]:border-emerald-500 bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg"
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          className="data-[state=on]:bg-yellow-300 data-[state=on]:text-slate-900 data-[state=on]:border-yellow-500 bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg"
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          className="data-[state=on]:bg-pink-300 data-[state=on]:text-slate-900 data-[state=on]:border-pink-500 bg-white border-2 border-slate-200 hover:border-slate-900 shadow-sm rounded-lg"
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Toggle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={`bg-white border-2 ${editor.isActive('link') ? 'border-violet-600 bg-violet-100' : 'border-slate-200 hover:border-slate-900'} shadow-sm rounded-lg px-2 h-9`}
          title="Add Link"
        >
          <Link2 className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex gap-1 items-center">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="p-4 bg-white cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>

       <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror blockquote {
            border-left: 4px solid #0f172a;
            padding-left: 1rem;
            margin-left: 0;
            font-style: italic;
            font-weight: 700;
            background: #f8fafc;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            border-radius: 0 0.5rem 0.5rem 0;
        }
        .ProseMirror pre {
            background: #0f172a;
            color: #f8fafc;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 4px solid #000;
            box-shadow: 4px 4px 0 #0f172a;
        }
        .ProseMirror code {
            font-family: monospace;
            background: #f1f5f9;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            border: 2px solid #cbd5e1;
            font-weight: bold;
        }
        .ProseMirror h2 {
            font-size: 1.5rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }
        .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
        }
        .ProseMirror li {
            margin-bottom: 0.25rem;
        }
      `}} />
    </div>
  )
}
