'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Underline,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
}

/**
 * Lightweight HTML editor for listing flat details (no TipTap dependency).
 * Stores a small allowlisted HTML subset in `description`.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Describe the flat, rooms, rules, and nearby landmarks…',
  className,
  minHeight = 160,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const setting = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || document.activeElement === el) return
    const next = value || ''
    if (el.innerHTML === next) return
    setting.current = true
    el.innerHTML = next
    setting.current = false
  }, [value])

  const emit = useCallback(() => {
    if (setting.current) return
    const el = ref.current
    if (!el) return
    onChange(el.innerHTML)
  }, [onChange])

  const toolbar = (
    cmd: string,
    arg?: string,
  ) => {
    ref.current?.focus()
    runCommand(cmd, arg)
    emit()
  }

  return (
    <div className={cn('overflow-hidden rounded-md border border-input', className)}>
      <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toolbar('bold')}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toolbar('italic')}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toolbar('underline')}
          aria-label="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toolbar('formatBlock', 'h2')}
          aria-label="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toolbar('insertUnorderedList')}
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toolbar('insertOrderedList')}
          aria-label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          'max-w-none px-3 py-2 text-sm outline-none',
          'empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold',
          '[&_p]:mb-2',
        )}
        style={{ minHeight }}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  )
}

/** Strip tags for validation / length checks. */
export function plainTextFromHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const ALLOWED = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'UL',
  'OL',
  'LI',
  'H2',
  'H3',
  'DIV',
])

/** Safe HTML for public listing detail (client-side allowlist). */
export function sanitizeListingHtml(html: string): string {
  if (typeof window === 'undefined') {
    return plainTextFromHtml(html)
  }
  const template = document.createElement('template')
  template.innerHTML = html || ''
  const walk = (node: Node) => {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (!ALLOWED.has(el.tagName)) {
          while (el.firstChild) {
            node.insertBefore(el.firstChild, el)
          }
          node.removeChild(el)
          continue
        }
        ;[...el.attributes].forEach(attr => el.removeAttribute(attr.name))
        walk(el)
      }
    }
  }
  walk(template.content)
  return template.innerHTML
}
