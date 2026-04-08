/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITEST?: boolean
}

interface Window {
  showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>
}
