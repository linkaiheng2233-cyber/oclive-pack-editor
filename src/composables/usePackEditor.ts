import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from 'vue'
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
import { pickRolesRootAndWritePack, isFolderExportSupported, writePackToRolesRootPath } from '../lib/exportFolder'
import { importRolePackFromZip, importedPackBrainHint } from '../lib/importPack'
import {
  applyLoadedPackToEditor,
  importedPackToApplyInput,
  type ApplyLoadedPackTargets,
} from '../lib/applyLoadedPackToEditor'
import { filterEmotionImageFiles } from '../lib/emotionAssets'
import { prepareExportPayload } from '../lib/exportPrepare'
import { validateExportPackDirectory } from '../lib/exportValidate'
import {
  mergeEditorReplyQualityAnchor,
  shouldPromptReplyQualityAnchor,
} from '../lib/replyQualityAnchorPreset'
import { parseJson, runAllPackChecks } from '../lib/packChecks'
import type { PackSession } from './useRolesWorkspace'
import { normalizeKnowledgePath, type KnowledgeMarkdownFile } from '../lib/knowledgeFiles'
import { validateKnowledgeFiles } from '../lib/knowledgeFrontMatter'
import { mergeMarketComposeIntoEditor, parseMarketComposeV1 } from '../lib/marketComposeImport'
import {
  patchManifestCreatorMessageToDownloader,
  readManifestCreatorMessageToDownloader,
} from '../lib/manifestCreatorDownloader'
import type { CreatorMessageExportMode } from '../lib/rolePackCreatorMessage'
import {
  buildAuthorJsonDisk,
  emptyAuthorRecRow,
  type AuthorRecRow,
} from '../lib/authorPack'
import { serializeUiConfig } from '../lib/uiConfig'
import { defaultUiConfig, type UiConfig } from '../types/uiConfig'
import {
  applySimpleManifestToJson,
  applySimpleSettingsToJson,
  countUserRelationKeys,
  defaultSimpleManifestForm,
  defaultSimpleSettingsForm,
  knowledgeFromPackRecords,
  manifestRecordToSimpleForm,
  settingsRecordToSimpleForm,
  type SimpleManifestForm,
  type SimpleSettingsForm,
} from '../lib/simpleCreation'

const STORAGE_REQUIRE_CHECKS = 'oclive-pack-editor-require-checks-before-export'
const STORAGE_CREATION_MODE = 'oclive-pack-editor-creation-mode'
const STORAGE_CREATOR_MSG_MODE = 'oclive-pack-editor-creator-msg-mode'

/** 简单模式表单 → JSON 防抖：避免每次按键都整表序列化，减轻大字段输入卡顿。 */
const SIMPLE_JSON_DEBOUNCE_MS = 220

export type ExportFolderWriteOptions = {
  rolesRootPath: string
  roleIdOverride?: string
}

export function usePackEditor() {
  const manifestText = ref(DEFAULT_MANIFEST_JSON)
  const settingsText = ref(DEFAULT_SETTINGS_JSON)
  const corePersonalityText = ref(DEFAULT_CORE_PERSONALITY_TEXT)
  const worldviewMarkdown = ref('')
  const knowledgeMarkdownFiles = ref<KnowledgeMarkdownFile[]>([])
  const emotionImageFiles = ref<File[]>([])
  /** 随包写入 creator_message.txt，供启动器只读展示（仅编写器可编辑） */
  const creatorMessageToOthers = ref('')
  /** unified：全文只导出首条非空行；per_module：每行一条（多模块各写一句时汇总） */
  const creatorMessageMode = ref<CreatorMessageExportMode>('unified')
  /** manifest `creator_message_to_downloader`：高级创作独立编辑，与 manifest 文本双向同步 */
  const creatorMessageToDownloaderManifest = ref('')
  const authorSummary = ref('')
  const authorDetailMarkdown = ref('')
  const authorRecommendedRows = ref<AuthorRecRow[]>([emptyAuthorRecRow()])
  const authorIncludeSuggestedUi = ref(false)
  const authorSuggestedBackendsJson = ref('')

  const validationErrors = ref<string[]>([])
  /** 最近一次检查是否用 wasm；`null` 表示本会话尚未跑过检查 */
  const validationLastUsedWasm = ref<boolean | null>(null)
  const lastMessage = ref('')
  /** 与 lastMessage 配套：错误类文案为 true，成功提示为 false */
  const lastMessageIsError = ref(false)
  const requireChecksBeforeExport = ref(true)
  /** 简单模式表单与 JSON 不一致时（JSON 无法解析）提示 */
  const syncFormWarning = ref('')
  /** 最近一次「写入文件夹」的 roles 根路径（桌面版 Tauri），供试聊默认角色目录 */
  const lastExportedRolesRoot = ref('')

  /** 由 App 绑定：idle 时拒绝「检查角色包」 */
  let packSessionRef: Ref<PackSession> | null = null

  function bindPackSession(session: Ref<PackSession>): void {
    packSessionRef = session
  }

  function noActivePackForCheck(): boolean {
    return packSessionRef?.value === 'idle'
  }

  const NO_ACTIVE_PACK_MSG =
    '当前没有可检查的角色包：请从开始页加载角色、导入 zip，或点击「创建新角色包」。'

  const creationMode = ref<'simple' | 'advanced'>('simple')
  const advancedTab = ref<'manifest' | 'settings' | 'core' | 'world' | 'images'>('manifest')

  const simpleM = reactive<SimpleManifestForm>(defaultSimpleManifestForm())
  const simpleS = reactive<SimpleSettingsForm>(defaultSimpleSettingsForm())
  const uiConfig = reactive<UiConfig>(defaultUiConfig())

  const multiRelationWarning = computed(
    () => creationMode.value === 'simple' && countUserRelationKeys(manifestText.value) > 1,
  )

  const emotionImageSummary = computed(() => {
    const n = emotionImageFiles.value.length
    return n === 0
      ? '未选择'
      : `已选 ${n} 个文件（导出至 manifest.id 对应目录下的 assets/images/）`
  })

  /** 与 manifest 同步写入 settings.knowledge；运行时合并以 settings 为准 */
  const simpleKnowledgeForSettings = computed(() => ({
    enabled: simpleM.knowledgeEnabled,
    glob: simpleM.knowledgeGlob,
  }))

  function packExtra(): Partial<PackExtraFiles> {
    const docs = knowledgeMarkdownFiles.value.filter((d) => d.content.trim())
    const authorJson = buildAuthorJsonDisk({
      summary: authorSummary.value,
      detailMarkdown: authorDetailMarkdown.value,
      rows: authorRecommendedRows.value,
      includeSuggestedUi: authorIncludeSuggestedUi.value,
      uiConfig,
      suggestedPluginBackendsJson: authorSuggestedBackendsJson.value,
    })
    return {
      uiConfigJson: serializeUiConfig(uiConfig),
      corePersonality: corePersonalityText.value,
      worldviewMarkdown: worldviewMarkdown.value,
      knowledgeMarkdownFiles: docs,
      emotionImages: emotionImageFiles.value,
      creatorMessage: creatorMessageToOthers.value,
      creatorMessageMode: creatorMessageMode.value,
      configJson: '{\n  "reply_post_processor": {\n    "enabled": false,\n    "backend": "builtin",\n    "builtin": { "profile": "standard" }\n  }\n}\n',
      ...(authorJson ? { authorJson } : {}),
    }
  }

  function syncKnowledgeFilesFromWorldview(): void {
    const world = worldviewMarkdown.value
    const idx = knowledgeMarkdownFiles.value.findIndex((d) => d.path === 'knowledge/world.md')
    if (!world.trim()) {
      if (idx >= 0) {
        const next = [...knowledgeMarkdownFiles.value]
        next.splice(idx, 1)
        knowledgeMarkdownFiles.value = next
      }
      return
    }
    if (idx >= 0) {
      const next = [...knowledgeMarkdownFiles.value]
      next[idx] = { ...next[idx], content: world }
      knowledgeMarkdownFiles.value = next
    } else {
      knowledgeMarkdownFiles.value = [
        { path: 'knowledge/world.md', content: world },
        ...knowledgeMarkdownFiles.value,
      ]
    }
  }

  watch(worldviewMarkdown, syncKnowledgeFilesFromWorldview)

  watch(
    manifestText,
    () => {
      const next = readManifestCreatorMessageToDownloader(manifestText.value)
      if (creatorMessageToDownloaderManifest.value !== next) {
        creatorMessageToDownloaderManifest.value = next
      }
    },
    { immediate: true },
  )

  watch(creatorMessageToDownloaderManifest, (v) => {
    const next = patchManifestCreatorMessageToDownloader(manifestText.value, v)
    if (next !== manifestText.value) {
      manifestText.value = next
    }
  })

  let simpleJsonDebounceTimer: ReturnType<typeof setTimeout> | undefined

  function cancelDebouncedSimpleToJson(): void {
    if (simpleJsonDebounceTimer !== undefined) {
      clearTimeout(simpleJsonDebounceTimer)
      simpleJsonDebounceTimer = undefined
    }
  }

  /**
   * 简单模式：立即将表单写入 manifest/settings 文本（并取消待执行的防抖）。
   * 导出、运行检查、切到「检查/试聊」前应调用，避免读到未落盘的表单。
   */
  function flushSimpleToJson(): void {
    cancelDebouncedSimpleToJson()
    if (creationMode.value === 'simple') applySimpleToJson()
  }

  function scheduleSimpleToJson(): void {
    if (creationMode.value !== 'simple') return
    cancelDebouncedSimpleToJson()
    simpleJsonDebounceTimer = setTimeout(() => {
      simpleJsonDebounceTimer = undefined
      applySimpleToJson()
    }, SIMPLE_JSON_DEBOUNCE_MS)
  }

  function syncFormsFromJson(): void {
    cancelDebouncedSimpleToJson()
    syncFormWarning.value = ''
    const errs: string[] = []
    const m = parseJson<Record<string, unknown>>(manifestText.value, 'manifest.json')
    if (!m.ok) errs.push(m.error)
    else Object.assign(simpleM, manifestRecordToSimpleForm(m.value))

    const s = parseJson<Record<string, unknown>>(settingsText.value, 'settings.json')
    if (!s.ok) errs.push(s.error)
    else Object.assign(simpleS, settingsRecordToSimpleForm(s.value))

    if (m.ok && s.ok) {
      const k = knowledgeFromPackRecords(m.value, s.value)
      simpleM.knowledgeEnabled = k.enabled
      simpleM.knowledgeGlob = k.glob
    }

    if (errs.length) syncFormWarning.value = errs.join(' ')
  }

  function applySimpleToJson(): void {
    manifestText.value = applySimpleManifestToJson(manifestText.value, simpleM)
    settingsText.value = applySimpleSettingsToJson(
      settingsText.value,
      simpleS,
      simpleKnowledgeForSettings.value,
    )
  }

  watch(
    () => simpleM,
    scheduleSimpleToJson,
    { deep: true },
  )
  watch(
    () => simpleS,
    scheduleSimpleToJson,
    { deep: true },
  )

  watch(creationMode, (mode, prev) => {
    try {
      localStorage.setItem(STORAGE_CREATION_MODE, mode)
    } catch {
      /* ignore */
    }
    if (prev === 'simple' && mode === 'advanced') {
      flushSimpleToJson()
    }
    if (mode === 'simple') syncFormsFromJson()
  })

  function loadPersistedChecks(): void {
    try {
      const v = localStorage.getItem(STORAGE_REQUIRE_CHECKS)
      if (v === 'false') requireChecksBeforeExport.value = false
      const cm = localStorage.getItem(STORAGE_CREATION_MODE)
      if (cm === 'advanced' || cm === 'simple') creationMode.value = cm
      const em = localStorage.getItem(STORAGE_CREATOR_MSG_MODE)
      if (em === 'unified' || em === 'per_module') creatorMessageMode.value = em
    } catch {
      /* ignore */
    }
  }

  onMounted(() => {
    loadPersistedChecks()
    try {
      const lr = localStorage.getItem('oclive-pack-editor-last-roles-root')
      if (lr) lastExportedRolesRoot.value = lr
    } catch {
      /* ignore */
    }
    // Avoid parsing large JSON texts at cold start when user is in advanced mode.
    // When switching to simple mode, the creationMode watcher will sync again.
    if (creationMode.value === 'simple') {
      syncFormsFromJson()
    }
  })

  onBeforeUnmount(() => {
    cancelDebouncedSimpleToJson()
  })

  function persistRequireChecks(): void {
    try {
      localStorage.setItem(STORAGE_REQUIRE_CHECKS, requireChecksBeforeExport.value ? 'true' : 'false')
    } catch {
      /* ignore */
    }
  }

  watch(requireChecksBeforeExport, persistRequireChecks)

  watch(creatorMessageMode, (m) => {
    try {
      localStorage.setItem(STORAGE_CREATOR_MSG_MODE, m)
    } catch {
      /* ignore */
    }
  })

  const folderExportOk = computed(() => isFolderExportSupported())

  /** manifest.json 顶层 `id`，供试聊默认路径等 */
  const manifestRoleId = computed(() => {
    const m = parseJson<Record<string, unknown>>(manifestText.value, 'manifest.json')
    if (!m.ok) return ''
    const id = m.value.id
    return typeof id === 'string' ? id : ''
  })

  async function collectValidationState(): Promise<{
    errors: string[]
    wasmUsed: boolean
    ok: boolean
  }> {
    flushSimpleToJson()
    const r = await runAllPackChecks(manifestText.value, settingsText.value)
    const kErrs = validateKnowledgeFiles(knowledgeMarkdownFiles.value)
    return {
      errors: [...r.errors, ...kErrs],
      wasmUsed: r.wasmUsed,
      ok: r.ok && kErrs.length === 0,
    }
  }

  async function runValidate(): Promise<void> {
    if (noActivePackForCheck()) {
      validationErrors.value = [NO_ACTIVE_PACK_MSG]
      validationLastUsedWasm.value = null
      setFeedback(NO_ACTIVE_PACK_MSG, true)
      return
    }
    const v = await collectValidationState()
    validationErrors.value = v.errors
    validationLastUsedWasm.value = v.wasmUsed
    if (v.ok) {
      setFeedback('角色包检查通过，未发现错误（非环境/Ollama 检测）。', false)
    } else {
      setFeedback(`角色包有 ${v.errors.length} 处问题（非环境故障）。`, true)
    }
  }

  async function checksPassForExport(): Promise<boolean> {
    if (!requireChecksBeforeExport.value) return true
    if (noActivePackForCheck()) {
      validationErrors.value = [NO_ACTIVE_PACK_MSG]
      validationLastUsedWasm.value = null
      setFeedback(NO_ACTIVE_PACK_MSG, true)
      return false
    }
    const v = await collectValidationState()
    validationErrors.value = v.errors
    validationLastUsedWasm.value = v.wasmUsed
    return v.ok
  }

  async function onImportPack(e: Event): Promise<void> {
    const inp = e.target as HTMLInputElement
    const f = inp.files?.[0]
    setFeedback('', false)
    if (!f) return
    try {
      const imp = await importRolePackFromZip(f)
      applyLoadedPackToEditor(importedPackToApplyInput(imp), applyLoadedPackTargets)
      setFeedback(
        `已导入角色「${imp.roleId}」。可继续编辑后导出。 ${importedPackBrainHint(imp.settingsJson)}`,
        false,
      )
    } catch (err) {
      setFeedback(`导入失败：${err instanceof Error ? err.message : String(err)}`, true)
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

  function addAuthorRecommendedRow(): void {
    authorRecommendedRows.value = [
      ...authorRecommendedRows.value,
      emptyAuthorRecRow(),
    ]
  }

  function removeAuthorRecommendedRow(index: number): void {
    if (authorRecommendedRows.value.length <= 1) return
    const next = [...authorRecommendedRows.value]
    next.splice(index, 1)
    authorRecommendedRows.value = next
  }

  function addKnowledgeFile(path = 'knowledge/lore.md'): void {
    const p = normalizeKnowledgePath(path)
    if (knowledgeMarkdownFiles.value.some((x) => x.path === p)) return
    knowledgeMarkdownFiles.value = [...knowledgeMarkdownFiles.value, { path: p, content: '' }]
  }

  function updateKnowledgeFile(index: number, patch: Partial<KnowledgeMarkdownFile>): void {
    const prev = knowledgeMarkdownFiles.value[index]
    if (!prev) return
    const path = patch.path !== undefined ? normalizeKnowledgePath(patch.path) : prev.path
    const content = patch.content !== undefined ? patch.content : prev.content
    const next = [...knowledgeMarkdownFiles.value]
    next[index] = { path, content }
    knowledgeMarkdownFiles.value = next
    if (path === 'knowledge/world.md') worldviewMarkdown.value = content
  }

  function removeKnowledgeFile(index: number): void {
    const prev = knowledgeMarkdownFiles.value[index]
    if (!prev) return
    const next = [...knowledgeMarkdownFiles.value]
    next.splice(index, 1)
    knowledgeMarkdownFiles.value = next
    if (prev.path === 'knowledge/world.md') worldviewMarkdown.value = ''
  }

  /** 导出 zip / 写文件夹前：若尚未配置 `reply_quality_anchor`，询问是否并入编写器推荐文案。 */
  function applyReplyQualityAnchorPrompt(
    settings: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!shouldPromptReplyQualityAnchor(settings)) {
      return { ...settings }
    }
    const include = window.confirm(
      '是否在导出时写入推荐的「回复质量锚点」到 prompts/reply_quality_anchor.md？\n\n' +
        '将写入 v2 推荐路径，含：禁止复述用户原句、简短确认时延续话题勿重复开场、按用户信息量调节篇幅（非固定字数）、不替用户拟定台词等（与 oclive 主程序默认一致）。\n\n' +
        '确定 = 加入推荐内容\n取消 = 不加入，按当前 JSON 原样导出',
    )
    return mergeEditorReplyQualityAnchor(settings, include)
  }

  /**
   * 导出前：简单模式写回 JSON →（可选）全量检查 → 解析 payload。
   */
  async function tryBuildExportPayload():
    Promise<
      | { ok: true; roleId: string; manifest: Record<string, unknown>; settings: Record<string, unknown> }
      | { ok: false; message: string }
    > {
    flushSimpleToJson()
    if (!(await checksPassForExport())) {
      return {
        ok: false,
        message: '请先通过全部检查，或关闭「导出前校验包内容」后再导出。',
      }
    }
    const payload = prepareExportPayload(manifestText.value, settingsText.value)
    if (!payload.ok) return payload
    const dirCheck = await validateExportPackDirectory(
      payload.roleId,
      payload.manifest,
      payload.settings,
      packExtra(),
    )
    if (!dirCheck.ok) {
      return {
        ok: false,
        message: `导出目录校验未通过：\n${dirCheck.errors.join('\n')}`,
      }
    }
    return payload
  }

  function setFeedback(text: string, isError: boolean): void {
    lastMessage.value = text
    lastMessageIsError.value = isError
  }

  /**
   * 粘贴 oclive-plugin-market「模块组合」页复制的 JSON，合并进简单创作（人设长文 / 世界观 / 身份提示）。
   */
  function applyMarketComposeJson(raw: string): { ok: boolean; message: string } {
    const p = parseMarketComposeV1(raw.trim())
    if (!p.ok) {
      setFeedback(p.error, true)
      return { ok: false, message: p.error }
    }
    const merged = mergeMarketComposeIntoEditor(p.data, {
      corePersonalityText: corePersonalityText.value,
      worldviewMarkdown: worldviewMarkdown.value,
      relationPromptHint: simpleM.relationPromptHint,
    })
    corePersonalityText.value = merged.corePersonalityText
    worldviewMarkdown.value = merged.worldviewMarkdown
    simpleM.relationPromptHint = merged.relationPromptHint
    creationMode.value = 'simple'
    flushSimpleToJson()
    setFeedback(
      '已从市场模块组合合并到简单创作（追加到人设、世界观与身份提示）。请到「简单」页继续编辑并导出。',
      false,
    )
    return { ok: true, message: '已应用。' }
  }

  async function exportZip(ocpak: boolean): Promise<void> {
    setFeedback('', false)
    const built = await tryBuildExportPayload()
    if (!built.ok) {
      setFeedback(built.message, true)
      return
    }
    let { roleId, manifest, settings } = built
    settings = applyReplyQualityAnchorPrompt(settings)
    try {
      const blob = await buildRolePackZipBlob(roleId, manifest, settings, packExtra())
      const name = suggestedZipName(roleId, ocpak)
      triggerDownload(blob, name)
      setFeedback(
        `已下载 ${name}。将解压出的「${roleId}」文件夹放入本机 oclive 的 roles 目录即可测试。`,
        false,
      )
    } catch (e) {
      setFeedback(`导出 zip 失败：${e instanceof Error ? e.message : String(e)}`, true)
    }
  }

  const applyLoadedPackTargets: ApplyLoadedPackTargets = {
    manifestText,
    settingsText,
    corePersonalityText,
    worldviewMarkdown,
    knowledgeMarkdownFiles,
    emotionImageFiles,
    creatorMessageToOthers,
    creatorMessageMode,
    uiConfig,
    authorSummary,
    authorDetailMarkdown,
    authorRecommendedRows,
    authorIncludeSuggestedUi,
    authorSuggestedBackendsJson,
    syncFormsFromJson,
  }

  async function exportFolder(writeOptions?: ExportFolderWriteOptions): Promise<void> {
    setFeedback('', false)
    const built = await tryBuildExportPayload()
    if (!built.ok) {
      setFeedback(built.message, true)
      return
    }
    let { roleId, manifest, settings } = built
    if (writeOptions?.roleIdOverride?.trim()) {
      roleId = writeOptions.roleIdOverride.trim()
      manifest = { ...manifest, id: roleId }
    }
    settings = applyReplyQualityAnchorPrompt(settings)
    try {
      if (writeOptions?.rolesRootPath.trim()) {
        await writePackToRolesRootPath(
          writeOptions.rolesRootPath.trim(),
          roleId,
          manifest,
          settings,
          packExtra(),
        )
        lastExportedRolesRoot.value = writeOptions.rolesRootPath.trim()
        try {
          localStorage.setItem('oclive-pack-editor-last-roles-root', writeOptions.rolesRootPath.trim())
          localStorage.setItem('oclive-pack-editor-roles-root', writeOptions.rolesRootPath.trim())
        } catch {
          /* ignore */
        }
        setFeedback(
          `已写入 ${roleId}/ 到 ${writeOptions.rolesRootPath.trim()}（roles 根）。可直接启动 oclive 测试。`,
          false,
        )
        return
      }
      const result = await pickRolesRootAndWritePack(roleId, manifest, settings, packExtra())
      if (!result.wrote) return
      if (result.rolesRootPath) {
        lastExportedRolesRoot.value = result.rolesRootPath
        try {
          localStorage.setItem('oclive-pack-editor-last-roles-root', result.rolesRootPath)
          localStorage.setItem('oclive-pack-editor-roles-root', result.rolesRootPath)
        } catch {
          /* ignore */
        }
      }
      setFeedback(
        `已写入 ${roleId}/ 到所选目录（作为 roles 根）。可直接启动 oclive 测试。`,
        false,
      )
    } catch (e) {
      setFeedback(`写入失败：${e instanceof Error ? e.message : String(e)}`, true)
    }
  }

  return {
    manifestText,
    settingsText,
    corePersonalityText,
    worldviewMarkdown,
    knowledgeMarkdownFiles,
    emotionImageFiles,
    creatorMessageToOthers,
    creatorMessageMode,
    creatorMessageToDownloaderManifest,
    authorSummary,
    authorDetailMarkdown,
    authorRecommendedRows,
    authorIncludeSuggestedUi,
    authorSuggestedBackendsJson,
    validationErrors,
    validationLastUsedWasm,
    lastExportedRolesRoot,
    lastMessage,
    lastMessageIsError,
    requireChecksBeforeExport,
    syncFormWarning,
    creationMode,
    advancedTab,
    simpleM,
    simpleS,
    uiConfig,
    multiRelationWarning,
    emotionImageSummary,
    folderExportOk,
    manifestRoleId,
    bindPackSession,
    runValidate,
    onImportPack,
    onEmotionFilesPick,
    onEmotionFilesAppend,
    clearEmotionImages,
    addAuthorRecommendedRow,
    removeAuthorRecommendedRow,
    addKnowledgeFile,
    updateKnowledgeFile,
    removeKnowledgeFile,
    exportZip,
    exportFolder,
    /** 简单模式：立即同步表单 → JSON（供切页前调用） */
    flushSimpleToJson,
    /** 市场「模块组合」JSON → 合并进简单创作 */
    applyMarketComposeJson,
    applyLoadedPackTargets,
  }
}
