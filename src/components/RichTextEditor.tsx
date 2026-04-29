'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, List, ListOrdered, Quote, Heading2, Link2, Code, Undo, Redo, Image as ImageIcon, Youtube as YoutubeIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify
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
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-4 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]',
        },
      }),
      Youtube.configure({
        controls: false,
        nocookie: true,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl my-4 border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a]',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-violet-600 underline font-black cursor-pointer hover:text-violet-800',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Mulai mengetik modul spektakuler di sini...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }: any) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] font-medium leading-relaxed prose-headings:font-black prose-a:text-violet-600',
      },
    },
    immediatelyRender: false,
  })

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Masukkan URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Masukkan URL Gambar:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addYoutube = () => {
    const url = window.prompt('Masukkan Link YouTube:')
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  return (
    <div className="flex flex-col border-4 border-slate-900 rounded-3xl shadow-[8px_8px_0px_#0f172a] bg-white overflow-hidden transition-all focus-within:shadow-[12px_12px_0px_#0f172a] focus-within:-translate-y-1">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-50 border-b-4 border-slate-900 sticky top-0 z-10">
        
        {/* Formatting */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-slate-200">
          <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()} className="data-[state=on]:bg-slate-900 data-[state=on]:text-white rounded-lg hover:bg-slate-100" title="Bold">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()} className="data-[state=on]:bg-slate-900 data-[state=on]:text-white rounded-lg hover:bg-slate-100" title="Italic">
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} className="data-[state=on]:bg-slate-900 data-[state=on]:text-white rounded-lg hover:bg-slate-100" title="Underline">
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()} className="data-[state=on]:bg-slate-900 data-[state=on]:text-white rounded-lg hover:bg-slate-100" title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </Toggle>
        </div>
        
        {/* Alignment */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-slate-200">
          <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()} className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 rounded-lg hover:bg-slate-100">
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()} className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 rounded-lg hover:bg-slate-100">
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()} className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 rounded-lg hover:bg-slate-100">
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive({ textAlign: 'justify' })} onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()} className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 rounded-lg hover:bg-slate-100">
            <AlignJustify className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Blocks */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-slate-200">
          <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="data-[state=on]:bg-violet-100 data-[state=on]:text-violet-700 rounded-lg hover:bg-slate-100 font-black">
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} className="data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-700 rounded-lg hover:bg-slate-100">
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} className="data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-700 rounded-lg hover:bg-slate-100">
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} className="data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 rounded-lg hover:bg-slate-100">
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive('code')} onPressedChange={() => editor.chain().focus().toggleCode().run()} className="data-[state=on]:bg-pink-100 data-[state=on]:text-pink-700 rounded-lg hover:bg-slate-100">
            <Code className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Media & Embeds */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-slate-200">
          <Button type="button" variant="ghost" size="sm" onClick={setLink} className={`rounded-lg ${editor.isActive('link') ? 'bg-violet-100 text-violet-700' : 'hover:bg-slate-100'}`} title="Tambahkan Tautan">
            <Link2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={addImage} className="rounded-lg hover:bg-slate-100 text-emerald-600" title="Sisipkan Gambar (URL)">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={addYoutube} className="rounded-lg hover:bg-slate-100 text-red-500" title="Embed Video YouTube">
            <YoutubeIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* History */}
        <div className="ml-auto flex gap-1 items-center bg-white p-1 rounded-xl border-2 border-slate-200">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-lg" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="p-6 md:p-10 bg-white cursor-text min-h-[60vh]" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>

       <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #cbd5e1;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .ProseMirror {
            outline: none !important;
            font-size: 1.125rem; /* text-lg */
        }
        .ProseMirror blockquote {
            border-left: 6px solid #0f172a;
            padding-left: 1.5rem;
            margin-left: 0;
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
            font-style: italic;
            font-weight: 700;
            background: #f8fafc;
            padding-top: 1rem;
            padding-bottom: 1rem;
            border-radius: 0 1rem 1rem 0;
            color: #334155;
        }
        .ProseMirror pre {
            background: #0f172a;
            color: #f8fafc;
            padding: 1.5rem;
            border-radius: 1rem;
            border: 4px solid #0f172a;
            box-shadow: 6px 6px 0 #cbd5e1;
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
            overflow-x: auto;
        }
        .ProseMirror code {
            font-family: monospace;
            background: #f1f5f9;
            padding: 0.2rem 0.5rem;
            border-radius: 0.5rem;
            border: 2px solid #cbd5e1;
            font-weight: bold;
            color: #db2777;
        }
        .ProseMirror h2 {
            font-size: 2.25rem;
            font-weight: 900;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            color: #0f172a;
            line-height: 1.2;
        }
        .ProseMirror h3 {
            font-size: 1.5rem;
            font-weight: 800;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            color: #1e293b;
        }
        .ProseMirror p {
            margin-bottom: 1.25rem;
        }
        .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .ProseMirror li {
            margin-bottom: 0.5rem;
            padding-left: 0.5rem;
        }
        /* Iframe wrappers for YouTube */
        .ProseMirror div[data-youtube-video] {
            cursor: move;
            padding-right: 24px;
        }
        .ProseMirror img {
            display: block;
            max-width: 100%;
            border-radius: 1rem;
            border: 4px solid #0f172a;
            box-shadow: 8px 8px 0 #0f172a;
            margin: 2rem auto;
        }
      `}} />
    </div>
  )
}
