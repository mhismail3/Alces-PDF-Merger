import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const OUTPUT_DIR = join(process.cwd(), 'samples')

const palettes = [
  [rgb(0.15, 0.45, 0.4), rgb(0.94, 0.86, 0.78)],
  [rgb(0.76, 0.34, 0.21), rgb(0.96, 0.91, 0.84)],
  [rgb(0.2, 0.28, 0.5), rgb(0.93, 0.88, 0.78)],
]

const docs = [
  { name: 'sample-modern.pdf', pages: ['Front page', 'Details', 'Back'] },
  { name: 'sample-forms.pdf', pages: ['Form A', 'Form B'] },
  { name: 'sample-notes.pdf', pages: ['Notes 1', 'Notes 2', 'Notes 3', 'Notes 4'] },
]

async function createDoc(name, pageTitles, palette) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)

  pageTitles.forEach((title, index) => {
    const page = pdf.addPage()
    const { width, height } = page.getSize()
    const bg = palette[index % palette.length]
    const fg = palette[(index + 1) % palette.length]
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: bg,
    })
    page.drawText(title, {
      x: 60,
      y: height / 2,
      size: 32,
      font,
      color: fg,
    })
    page.drawText(`Page ${index + 1}`, {
      x: 60,
      y: height / 2 - 46,
      size: 16,
      font,
      color: fg,
    })
  })

  const bytes = await pdf.save()
  await writeFile(join(OUTPUT_DIR, name), bytes)
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  await Promise.all(
    docs.map((doc, idx) => createDoc(doc.name, doc.pages, palettes[idx % palettes.length])),
  )
  console.log(`Sample PDFs generated in ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
