import type { ChangeEvent, DragEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PDFDocument } from 'pdf-lib'
import localforage from 'localforage'
import { nanoid } from 'nanoid'
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
} from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './App.css'

GlobalWorkerOptions.workerSrc = workerSrc

type SourceDoc = {
  id: string
  name: string
  size: number
  lastModified: number
  pageCount: number
  data: Uint8Array
  addedAt: number
}

type PageItem = {
  id: string
  docId: string
  docName: string
  pageNumber: number
  thumbnail: string
}

type PersistedState = {
  docs: SourceDoc[]
  pages: PageItem[]
  timestamp: number
}

type SortableCardProps = {
  page: PageItem
  onDelete: (id: string) => void
}

const STORAGE_KEY = 'pdf-merger-session'
const THEME_KEY = 'pdf-merger-theme'

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(1)} ${units[exponent]}`
}

const SortablePageCard = ({ page, onDelete }: SortableCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: page.id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article
      className={`page-card${isDragging ? ' dragging' : ''}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="page-thumb">
        {page.thumbnail ? (
          <img src={page.thumbnail} alt={`Page ${page.pageNumber}`} />
        ) : (
          <div className="page-thumb-fallback">PDF</div>
        )}
      </div>
      <div className="page-meta">
        <p className="page-label">Page {page.pageNumber}</p>
        <p className="page-doc">{page.docName}</p>
      </div>
      <button
        className="ghost-button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(page.id)
        }}
        aria-label="Remove page"
        type="button"
      >
        ✕
      </button>
    </article>
  )
}

function App() {
  const [docs, setDocs] = useState<SourceDoc[]>([])
  const [pages, setPages] = useState<PageItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [outputName, setOutputName] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const toastTimer = useRef<number | null>(null)
  const prefersCoarsePointer = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches
  }, [])
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: prefersCoarsePointer
        ? { distance: 6 }
        : { distance: 5 },
    }),
  )

  const docLookup = useMemo(
    () => new Map(docs.map((doc) => [doc.id, doc])),
    [docs],
  )

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await localforage.getItem<PersistedState>(STORAGE_KEY)
        if (saved?.docs?.length) {
          setDocs(saved.docs)
          setPages(saved.pages)
          setLastSaved(saved.timestamp)
          queueToast('Session restored from this browser')
        }
      } catch (err) {
        queueToast('Could not restore your previous workspace')
        console.error(err)
      } finally {
        setHydrated(true)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const persist = async () => {
      try {
        const timestamp = Date.now()
        const payload: PersistedState = { docs, pages, timestamp }
        await localforage.setItem(STORAGE_KEY, payload)
        setLastSaved(timestamp)
      } catch (err) {
        console.error(err)
        queueToast('Unable to save session locally')
      }
    }
    void persist()
  }, [docs, pages, hydrated])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  const queueToast = (message: string) => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current)
    }
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 4200)
  }

  const renderThumbnails = async (
    pdf: PDFDocumentProxy,
    docId: string,
    name: string,
  ) => {
    const nextPages: PageItem[] = []
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex)
      const viewport = page.getViewport({ scale: 0.38 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      if (!context) {
        throw new Error('Canvas context missing')
      }
      const renderTask = page.render({
        canvasContext: context,
        canvas,
        viewport,
      })
      await renderTask.promise
      const thumbnail = canvas.toDataURL('image/png')
      nextPages.push({
        id: nanoid(),
        docId,
        docName: name,
        pageNumber: pageIndex,
        thumbnail,
      })
      canvas.width = 0
      canvas.height = 0
    }
    return nextPages
  }

  const ingestFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    // Copy the buffer so we keep a stable version for storage and another for rendering.
    const storageBytes = new Uint8Array(arrayBuffer.slice(0))
    const renderBytes = storageBytes.slice()

    const pdf = await getDocument({ data: renderBytes }).promise
    const docId = nanoid()
    const thumbnails = await renderThumbnails(pdf, docId, file.name)
    const pageCount = pdf.numPages
    pdf.cleanup()
    pdf.destroy()

    const newDoc: SourceDoc = {
      id: docId,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      pageCount,
      data: storageBytes,
      addedAt: Date.now(),
    }

    return { doc: newDoc, pages: thumbnails }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const incoming = Array.from(files).filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf'),
    )
    if (!incoming.length) {
      queueToast('Drop PDF files to get started')
      return
    }

    setProcessing(true)

    try {
      const processedDocs: SourceDoc[] = []
      const processedPages: PageItem[] = []

      for (const file of incoming) {
        const result = await ingestFile(file)
        processedDocs.push(result.doc)
        processedPages.push(...result.pages)
      }

      setDocs((prev) => [...prev, ...processedDocs])
      setPages((prev) => [...prev, ...processedPages])
      queueToast(`Added ${processedDocs.length} PDF${processedDocs.length > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      queueToast('There was an issue reading one of the PDFs')
    } finally {
      setProcessing(false)
    }
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      void handleFiles(event.target.files)
      event.target.value = ''
    }
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (processing) return
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files)
    }
  }

  const mergeAndDownload = async () => {
    if (!pages.length) return
    setProcessing(true)

    try {
      const composed = await PDFDocument.create()
      const loadedDocs = new Map<string, PDFDocument>()

      for (const page of pages) {
        const source = docLookup.get(page.docId)
        if (!source) continue

        let loaded = loadedDocs.get(page.docId)
        if (!loaded) {
          loaded = await PDFDocument.load(source.data)
          loadedDocs.set(page.docId, loaded)
        }

        const [copied] = await composed.copyPages(loaded, [page.pageNumber - 1])
        composed.addPage(copied)
      }

      const bytes = await composed.save()
      const payload = Uint8Array.from(bytes)
      const blob = new Blob([payload.buffer], { type: 'application/pdf' })
      const link = document.createElement('a')
      const safeName = (outputName || 'merged-document').replace(/\s+/g, '-')
      link.href = URL.createObjectURL(blob)
      link.download = `${safeName}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
      queueToast('Merged PDF ready')
    } catch (err) {
      console.error(err)
      queueToast('Unable to compose PDF right now')
    } finally {
      setProcessing(false)
    }
  }

  const deleteDoc = (docId: string) => {
    setDocs((prev) => prev.filter((doc) => doc.id !== docId))
    setPages((prev) => prev.filter((page) => page.docId !== docId))
  }

  const deletePage = (pageId: string) => {
    setPages((prev) => prev.filter((page) => page.id !== pageId))
  }

  const resetWorkspace = async () => {
    setDocs([])
    setPages([])
    setLastSaved(null)
    await localforage.removeItem(STORAGE_KEY)
    queueToast('Workspace cleared')
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return
    setPages((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === activeId)
      const newIndex = prev.findIndex((item) => item.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const totalSize = docs.reduce((acc, doc) => acc + doc.size, 0)

  return (
    <div className="app-shell" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <div className="grain" />
      <header className="topbar">
        <div>
          <div className="brand-row">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>
            <h1>PDF Merger</h1>
          </div>
          <p className="lede">
            Drop PDFs, peek every page, reorder with a drag, trim what you don&apos;t need,
            and export a fresh, perfectly sequenced document. Your session quietly persists
            in this browser.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            type="button"
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <div className="pill-stack">
            <span className="pill">Session saves locally</span>
            {lastSaved && (
              <span className="pill soft">
                Saved {new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(lastSaved)}
              </span>
            )}
            {processing && <span className="pill busy">Working…</span>}
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel upload">
          <div className="upload-header">
            <div>
              <p className="label">Import PDFs</p>
              <h2>Feed the stack</h2>
            </div>
            <div className="actions">
              <button
                className="outline-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                Select files
              </button>
              <button
                className="outline-button danger"
                type="button"
                onClick={() => void resetWorkspace()}
                disabled={processing || (!docs.length && !pages.length)}
              >
                Reset
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              hidden
              onChange={handleFileInput}
            />
          </div>

          <div
            className={`dropzone ${processing ? 'disabled' : ''}`}
            onDrop={handleDrop}
          >
            <div className="drop-inner">
              <p className="eyebrow">Drag & Drop</p>
              <p className="drop-title">Drop PDF files here</p>
              <p className="muted">or click to browse your computer</p>
              <button
                className="primary"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                Add PDFs
              </button>
            </div>
          </div>

          <div className="summary">
            <div>
              <p className="label">Documents</p>
              <p className="stat">{docs.length}</p>
            </div>
            <div>
              <p className="label">Pages in play</p>
              <p className="stat">{pages.length}</p>
            </div>
            <div>
              <p className="label">Payload size</p>
              <p className="stat">{formatBytes(totalSize)}</p>
            </div>
          </div>

          {!!docs.length && (
            <div className="doc-list">
              {docs.map((doc) => (
                <div key={doc.id} className="doc-row">
                  <div>
                    <p className="doc-name">{doc.name}</p>
                    <p className="muted">
                      {doc.pageCount} pages · {formatBytes(doc.size)}
                    </p>
                  </div>
                  <button
                    className="outline-button"
                    type="button"
                    onClick={() => deleteDoc(doc.id)}
                    aria-label={`Remove ${doc.name}`}
                    disabled={processing}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="export">
            <div>
              <p className="label">Output name</p>
              <input
                className="text-input"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="new-title"
              />
            </div>
            <button
              className="primary large"
              type="button"
              onClick={() => void mergeAndDownload()}
              disabled={!pages.length || processing}
            >
              Download merged PDF
            </button>
          </div>
        </section>

        <section className="panel pages">
          <div className="pages-header">
            <div>
              <p className="label">Page order</p>
              <h2>Curate the flow</h2>
              <p className="muted">
                Drag to reorder, click ✕ to trim pages. Changes persist automatically.
              </p>
            </div>
          </div>

          {!pages.length ? (
            <div className="empty">
              <p className="drop-title">No pages yet</p>
              <p className="muted">Drop PDFs to see every page in miniature.</p>
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
              sensors={sensors}
            >
              <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div className="page-grid">
                  {pages.map((page) => (
                    <SortablePageCard key={page.id} page={page} onDelete={deletePage} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </main>

      <footer className="footer">
        <p className="muted">
          © {new Date().getFullYear()} Built by{' '}
          <a href="https://mhismail.com" target="_blank" rel="noreferrer">
            Mohsin Ismail
          </a>
        </p>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
