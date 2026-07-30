import { OFFICE_EXTENSIONS } from '../types'

interface EmscriptenFileSystem {
  mkdir(path: string): void
  readdir(path: string): string[]
  readFile(path: string, options?: { encoding: 'binary' }): Uint8Array
  writeFile(path: string, data: Uint8Array | string): void
}

interface EmscriptenModule {
  FS: EmscriptenFileSystem
  ccall: (
    funcName: string,
    returnType: string,
    argTypes: string[],
    args: unknown[],
  ) => number
  onRuntimeInitialized: () => void
  wasmBinary?: ArrayBuffer
}

interface ConversionResult {
  fileName: string
  bin: Uint8Array
  media: Record<string, string>
}

declare global {
  interface Window {
    Module: EmscriptenModule
  }
}

const SUPPORTED_EXTENSIONS = new Set<string>(OFFICE_EXTENSIONS)

const WORKING_DIRS = [
  '/working',
  '/working/media',
  '/working/fonts',
  '/working/themes',
]

const SCRIPT_PATH = './wasm/x2t/x2t.js'
const WASM_PATH = './wasm/x2t/x2t.wasm'
const INIT_TIMEOUT = 30000

const oAscFileType = {
  UNKNOWN: 0,
  PDF: 513,
  PDFA: 521,
  DOCX: 65,
  DOC: 66,
  ODT: 67,
  RTF: 68,
  TXT: 69,
  HTML: 70,
  DOCM: 75,
  DOTX: 76,
  XLSX: 257,
  XLS: 258,
  ODS: 259,
  CSV: 260,
  XLSM: 261,
  XLTX: 262,
  PPTX: 129,
  PPT: 130,
  ODP: 131,
  PPSX: 132,
  PPTM: 133,
} as const

const c_oAscFileType2 = Object.fromEntries(
  Object.entries(oAscFileType).map(([key, value]) => [value, key]),
) as Record<number, keyof typeof oAscFileType>

/** Resolve save target format from OnlyOffice outputformat or filename. */
export function resolveSaveFormat(
  outputformat: number | undefined,
  fileName: string,
): keyof typeof oAscFileType {
  if (outputformat != null && c_oAscFileType2[outputformat]) {
    const mapped = c_oAscFileType2[outputformat]
    if (mapped !== 'UNKNOWN') return mapped
  }
  const ext = fileName.split('.').pop()?.toUpperCase()
  if (ext && ext in oAscFileType) {
    return ext as keyof typeof oAscFileType
  }
  return 'DOCX'
}

async function fetchCompressed(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())
  // Uncompressed wasm starts with \0asm; uncompressed js with ASCII comment/code.
  const isWasm =
    buf[0] === 0x00 && buf[1] === 0x61 && buf[2] === 0x73 && buf[3] === 0x6d
  const isJsText =
    buf[0] === 0x2f /* / */ ||
    buf[0] === 0x76 /* v */ ||
    buf[0] === 0x28 /* ( */ ||
    buf[0] === 0x22 /* " */
  if (isWasm || isJsText) return buf

  // gzip magic
  const isGzip = buf[0] === 0x1f && buf[1] === 0x8b
  if (!isGzip) {
    throw new Error(`Unsupported compressed format for ${url}`)
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream is not available')
  }
  const stream = new Blob([toOwnedBytes(buf)])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function loadScriptFromText(code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const script = document.createElement('script')
    script.src = url
    script.onload = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    script.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load X2T WASM script'))
    }
    document.head.appendChild(script)
  })
}

/** Copy into a standalone ArrayBuffer-backed Uint8Array (DOM typings reject SharedArrayBuffer). */
function toOwnedBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return toOwnedBytes(bytes).buffer
}

class X2TConverter {
  private x2tModule: EmscriptenModule | null = null
  private isReady = false
  private initPromise: Promise<EmscriptenModule> | null = null
  private cachedJs: Uint8Array | null = null
  private cachedWasm: Uint8Array | null = null

  /** Prefetch and decompress x2t assets (optional warm-up). */
  async loadScript(): Promise<void> {
    if (this.cachedJs && this.cachedWasm) return
    const [jsBytes, wasmBytes] = await Promise.all([
      fetchCompressed(SCRIPT_PATH),
      fetchCompressed(WASM_PATH),
    ])
    this.cachedJs = jsBytes
    this.cachedWasm = wasmBytes
  }

  async initialize(): Promise<EmscriptenModule> {
    if (this.isReady && this.x2tModule) return this.x2tModule
    if (this.initPromise) return this.initPromise
    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize(): Promise<EmscriptenModule> {
    try {
      await this.loadScript()
      const jsBytes = this.cachedJs!
      const wasmBytes = this.cachedWasm!

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (!this.isReady) {
            reject(
              new Error(`X2T initialization timeout after ${INIT_TIMEOUT}ms`),
            )
          }
        }, INIT_TIMEOUT)

        const finish = (x2t: EmscriptenModule) => {
          try {
            clearTimeout(timeoutId)
            for (const dir of WORKING_DIRS) {
              try {
                x2t.FS.mkdir(dir)
              } catch {
                // may already exist
              }
            }
            this.x2tModule = x2t
            this.isReady = true
            resolve(x2t)
          } catch (error) {
            reject(error)
          }
        }

        window.Module = {
          ...(window.Module || ({} as EmscriptenModule)),
          wasmBinary: toArrayBuffer(wasmBytes),
          onRuntimeInitialized: () => finish(window.Module),
        }

        const jsText = new TextDecoder().decode(jsBytes)
        loadScriptFromText(jsText).catch(reject)
      })
    } catch (error) {
      this.initPromise = null
      throw error
    }
  }

  private assertSupportedExtension(extension: string): void {
    if (!SUPPORTED_EXTENSIONS.has(extension.toLowerCase())) {
      throw new Error(`Unsupported file format: ${extension}`)
    }
  }

  private sanitizeFileName(input: string): string {
    if (typeof input !== 'string' || !input.trim()) return 'file.bin'
    const parts = input.split('.')
    const ext = parts.pop() || 'bin'
    const name = parts.join('.')
    let sanitized = name
      .replace(/[/?<>\\:*|"]/g, '')
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .replace(/^\.+$/, '')
      .replace(/[&'%!"{}[\]]/g, '')
      .trim()
    if (!sanitized) sanitized = 'file'
    return `${sanitized.slice(0, 200)}.${ext}`
  }

  private executeConversion(paramsPath: string): void {
    if (!this.x2tModule) throw new Error('X2T module not initialized')
    const result = this.x2tModule.ccall(
      'main1',
      'number',
      ['string'],
      [paramsPath],
    )
    if (result !== 0) throw new Error(`Conversion failed with code: ${result}`)
  }

  private createConversionParams(
    fromPath: string,
    toPath: string,
    additionalParams = '',
  ): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<TaskQueueDataConvert xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <m_sFileFrom>${fromPath}</m_sFileFrom>
  <m_sThemeDir>/working/themes</m_sThemeDir>
  <m_sFileTo>${toPath}</m_sFileTo>
  <m_bIsNoBase64>false</m_bIsNoBase64>
  ${additionalParams}
</TaskQueueDataConvert>`
  }

  private readMediaFiles(): Record<string, string> {
    if (!this.x2tModule) return {}
    const media: Record<string, string> = {}
    try {
      const files = this.x2tModule.FS.readdir('/working/media/')
      for (const file of files) {
        if (file === '.' || file === '..') continue
        try {
          const fileData = this.x2tModule.FS.readFile(
            `/working/media/${file}`,
            {
              encoding: 'binary',
            },
          )
          media[`media/${file}`] = URL.createObjectURL(
            new Blob([toOwnedBytes(fileData)]),
          )
        } catch {
          // skip unreadable media
        }
      }
    } catch {
      // no media dir
    }
    return media
  }

  async convertDocument(file: File): Promise<ConversionResult> {
    await this.initialize()
    const fileName = file.name
    const fileExt = fileName.split('.').pop()?.toLowerCase() || ''
    this.assertSupportedExtension(fileExt)

    try {
      const data = new Uint8Array(await file.arrayBuffer())
      const sanitizedName = this.sanitizeFileName(fileName)
      const inputPath = `/working/${sanitizedName}`
      const outputPath = `${inputPath}.bin`

      this.x2tModule!.FS.writeFile(inputPath, data)
      this.x2tModule!.FS.writeFile(
        '/working/params.xml',
        this.createConversionParams(inputPath, outputPath),
      )
      this.executeConversion('/working/params.xml')

      return {
        fileName: sanitizedName,
        bin: this.x2tModule!.FS.readFile(outputPath),
        media: this.readMediaFiles(),
      }
    } catch (error) {
      throw new Error(
        `Document conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async convertBinToDocument(
    bin: Uint8Array | string,
    originalFileName: string,
    targetExt = 'DOCX',
  ): Promise<{ fileName: string; data: Uint8Array }> {
    await this.initialize()
    const sanitizedBase = this.sanitizeFileName(originalFileName).replace(
      /\.[^/.]+$/,
      '',
    )
    const binFileName = `${sanitizedBase}.bin`
    const outputFileName = `${sanitizedBase}.${targetExt.toLowerCase()}`

    try {
      // Asc strings (DOCY;vN;size;base64) must be written as text when
      // m_bIsNoBase64 is false — same as onlyoffice-web-local.
      this.x2tModule!.FS.writeFile(
        `/working/${binFileName}`,
        typeof bin === 'string' ? bin : toOwnedBytes(bin),
      )
      let additionalParams = ''
      if (targetExt === 'PDF' || targetExt === 'PDFA') {
        additionalParams = '<m_sFontDir>/working/fonts/</m_sFontDir>'
      }
      this.x2tModule!.FS.writeFile(
        '/working/params.xml',
        this.createConversionParams(
          `/working/${binFileName}`,
          `/working/${outputFileName}`,
          additionalParams,
        ),
      )
      this.executeConversion('/working/params.xml')
      return {
        fileName: outputFileName,
        data: this.x2tModule!.FS.readFile(`/working/${outputFileName}`),
      }
    } catch (error) {
      throw new Error(
        `Bin to document conversion failed (${targetExt}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

const x2tConverter = new X2TConverter()

export const initX2TScript = () => x2tConverter.loadScript()
export const initX2T = () => x2tConverter.initialize()
export const convertDocument = (file: File) =>
  x2tConverter.convertDocument(file)
export const convertBinToDocument = (
  bin: Uint8Array | string,
  fileName: string,
  targetExt?: string,
) => x2tConverter.convertBinToDocument(bin, fileName, targetExt)
