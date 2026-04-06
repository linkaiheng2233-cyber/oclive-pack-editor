import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  DEFAULT_CORE_PERSONALITY_TEXT,
  DEFAULT_MANIFEST_JSON,
  DEFAULT_SETTINGS_JSON,
} from '../defaults'
import {
  buildRolePackZipBlob,
  suggestedZipName,
  triggerDownload,
  type PackExtraFiles,
} from '../lib/exportPack'
import { pickRolesRootAndWritePack, isFolderExportSupported } from '../lib/exportFolder'
import { importRolePackFromZip } from '../lib/importPack'
import { filterEmotionImageFiles } from '../lib/emotionAssets'
import { prepareExportPayload } from '../lib/exportPrepare'
import { parseJson, runAllPackChecks } from '../lib/packChecks'
import {
  applySimpleManifestToJson,
  applySimpleSettingsToJson,
  countUserRelationKeys,
  defaultSimpleManifestForm,
  defaultSimpleSettingsForm,
  manifestRecordToSimpleForm,
  settingsRecordToSimpleForm,
  type SimpleManifestForm,
  type SimpleSettingsForm,
} from '../lib/simpleCreation'

const STORAGE_REQUIRE_CHECKS = 'oclive-pack-editor-require-checks-before-export'
const STORAGE_CREATION_MODE = 'oclive-pack-editor-creation-mode'

export function usePackEditor() {
  const manifestText = ref(DEFAULT_MANIFEST_JSON)
  const settingsText = ref(DEFAULT_SETTINGS_JSON)
  const corePersonalityText = ref(DEFAULT_CORE_PERSONALITY_TEXT)
  const worldviewMarkdown = ref('')
  const emotionImageFiles = ref<File[]>([])

  const validationErrors = ref<string[]>([])
  const lastMessage = ref('')
  const requireChecksBeforeExport = ref(true)
  /** 简单模式表单与 JSON 不一致时（JSON 无法解析）提示 */
  const syncFormWarning = ref('')

  const creationMode = ref<'simple' | 'advanced'>('simple')
  const advancedTab = ref<'manifest' | 'settings' | 'core' | 'world' | 'images'>('manifest')

  const simpleM = reactive<SimpleManifestForm>(defaultSimpleManifestForm())
  const simpleS = reactive<SimpleSettingsForm>(defaultSimpleSettingsForm())

  const multiRelationWarning = computed(
    () => creationMode.value === 'simple' && countUserRelationKeys(manifestText.value) > 1,
  )

  const emotionImageSummary = computed(() => {
    const n = emotionImageFiles.value.length
    return n === 0
      ? '未选择'
      : `已选 ${n} 个文件（导出至 manifest.id 对应目录下的 assets/images/）`
  })

  function packExtra(): Partial<PackExtraFiles> {
    return {
      corePersonality: corePersonalityText.value,
      worldviewMarkdown: worldviewMarkdown.value,
      emotionImages: emotionImageFiles.value,
    }
  }

  function syncFormsFromJson(): void {
    syncFormWarning.value = ''
    const errs: string[] = []
    const m = parseJson<Record<string, unknown>>(manifestText.value, 'manifest')
    if (!m.ok) errs.push(m.error)
    else Object.assign(simpleM, manifestRecordToSimpleForm(m.value))

    const s = parseJson<Record<string, unknown>>(settingsText.value, 'settings')
    if (!s.ok) errs.push(s.error)
    else Object.assign(simpleS, settingsRecordToSimpleForm(s.value))

    if (errs.length) syncFormWarning.value = errs.join(' ')
  }

  function applySimpleToJson(): void {
    manifestText.value = applySimpleManifestToJson(manifestText.value, simpleM)
    settingsText.value = applySimpleSettingsToJson(settingsText.value, simpleS)
  }

  function updateJsonFromSimple(): void {
    if (creationMode.value !== 'simple') return
    applySimpleToJson()
  }

  watch(
    () => simpleM,
    updateJsonFromSimple,
    { deep: true },
  )
  watch(
    () => simpleS,
    updateJsonFromSimple,
    { deep: true },
  )

  watch(creationMode, (mode) => {
    try {
      localStorage.setItem(STORAGE_CREATION_MODE, mode)
    } catch {
      /* ignore */
    }
    if (mode === 'simple') syncFormsFromJson()
  })

  function loadPersistedChecks(): void {
    try {
      const v = localStorage.getItem(STORAGE_REQUIRE_CHECKS)
      if (v === 'false') requireChecksBeforeExport.value = false
      const cm = localStorage.getItem(STORAGE_CREATION_MODE)
      if (cm === 'advanced' || cm === 'simple') creationMode.value = cm
    } catch {
      /* ignore */
    }
  }

  onMounted(() => {
    loadPersistedChecks()
    syncFormsFromJson()
  })

  function persistRequireChecks(): void {
    try {
      localStorage.setItem(STORAGE_REQUIRE_CHECKS, requireChecksBeforeExport.value ? 'true' : 'false')
    } catch {
      /* ignore */
    }
  }

  watch(requireChecksBeforeExport, persistRequireChecks)

  const folderExportOk = computed(() => isFolderExportSupported())

  function runValidate(): void {
    const r = runAllPackChecks(manifestText.value, settingsText.value)
    validationErrors.value = r.errors
  }

  function checksPassForExport(): boolean {
    if (!requireChecksBeforeExport.value) return true
    const r = runAllPackChecks(manifestText.value, settingsText.value)
    validationErrors.value = r.errors
    return r.ok
  }

  async function onImportPack(e: Event): Promise<void> {
    const inp = e.target as HTMLInputElement
    const f = inp.files?.[0]
    lastMessage.value = ''
    if (!f) return
    try {
      const imp = await importRolePackFromZip(f)
      manifestText.value = imp.manifestJson
      settingsText.value = imp.settingsJson
      corePersonalityText.value =
        imp.corePersonality.trim() || DEFAULT_CORE_PERSONALITY_TEXT
      worldviewMarkdown.value = imp.worldviewMarkdown
      emotionImageFiles.value = imp.emotionImageFiles
      syncFormsFromJson()
      lastMessage.value = `已导入角色「${imp.roleId}」。可继续编辑后导出。`
    } catch (err) {
      lastMessage.value = `导入失败：${err instanceof Error ? err.message : String(err)}`
    }
    inp.value = ''
  }

  function onEmotionFilesPick(e: Event): void {
    const inp = e.target as HTMLInputElement
    const fl = inp.files
    if (!fl?.length) return
    emotionImageFiles.value = filterEmotionImageFiles(fl)
    inp.value = ''
  }

  function onEmotionFilesAppend(e: Event): void {
    const inp = e.target as HTMLInputElement
    const fl = inp.files
    if (!fl?.length) return
    const add = filterEmotionImageFiles(fl)
    const names = new Set(emotionImageFiles.value.map((x) => x.name))
    for (const f of add) {
      if (!names.has(f.name)) {
        emotionImageFiles.value = [...emotionImageFiles.value, f]
        names.add(f.name)
      }
    }
    inp.value = ''
  }

  function clearEmotionImages(): void {
    emotionImageFiles.value = []
  }

  async function exportZip(ocpak: boolean): Promise<void> {
    lastMessage.value = ''
    if (creationMode.value === 'simple') applySimpleToJson()
    if (!checksPassForExport()) {
      lastMessage.value =
        '请先通过全部检查，或关闭「导出前校验包内容」后再导出。'
      return
    }
    const payload = prepareExportPayload(manifestText.value, settingsText.value)
    if (!payload.ok) {
      lastMessage.value = payload.message
      return
    }
    const { roleId, manifest, settings } = payload
    try {
      const blob = await buildRolePackZipBlob(roleId, manifest, settings, packExtra())
      const name = suggestedZipName(roleId, ocpak)
      triggerDownload(blob, name)
      lastMessage.value = `已下载 ${name}。将解压出的「${roleId}」文件夹放入本机 oclive 的 roles 目录即可测试。`
    } catch (e) {
      lastMessage.value = `导出 zip 失败：${e instanceof Error ? e.message : String(e)}`
    }
  }

  async function exportFolder(): Promise<void> {
    lastMessage.value = ''
    if (creationMode.value === 'simple') applySimpleToJson()
    if (!checksPassForExport()) {
      lastMessage.value =
        '请先通过全部检查，或关闭「导出前校验包内容」后再导出。'
      return
    }
    const payload = prepareExportPayload(manifestText.value, settingsText.value)
    if (!payload.ok) {
      lastMessage.value = payload.message
      return
    }
    const { roleId, manifest, settings } = payload
    try {
      const wrote = await pickRolesRootAndWritePack(roleId, manifest, settings, packExtra())
      if (!wrote) return
      lastMessage.value = `已写入 ${roleId}/ 到所选目录（作为 roles 根）。可直接启动 oclive 测试。`
    } catch (e) {
      lastMessage.value = `写入失败：${e instanceof Error ? e.message : String(e)}`
    }
  }

  return {
    manifestText,
    settingsText,
    corePersonalityText,
    worldviewMarkdown,
    emotionImageFiles,
    validationErrors,
    lastMessage,
    requireChecksBeforeExport,
    syncFormWarning,
    creationMode,
    advancedTab,
    simpleM,
    simpleS,
    multiRelationWarning,
    emotionImageSummary,
    folderExportOk,
    runValidate,
    onImportPack,
    onEmotionFilesPick,
    onEmotionFilesAppend,
    clearEmotionImages,
    exportZip,
    exportFolder,
  }
}
