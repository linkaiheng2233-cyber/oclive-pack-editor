import {
  validatePortraitCatalogState,
  type PortraitCatalogEntry,
  type PortraitCatalogValidationIssue,
  type PortraitSlotFileMap,
} from './portraitCatalog'

export type PortraitCheckResult = {
  errors: string[]
  warnings: string[]
}

export function runPortraitCatalogChecks(
  slotFiles: PortraitSlotFileMap,
  extraEntries: PortraitCatalogEntry[],
  portraitEnabled: boolean,
): PortraitCheckResult {
  const issues = validatePortraitCatalogState(slotFiles, extraEntries, portraitEnabled)
  return partitionIssues(issues)
}

function partitionIssues(issues: PortraitCatalogValidationIssue[]): PortraitCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  for (const i of issues) {
    if (i.level === 'error') errors.push(i.message)
    else warnings.push(i.message)
  }
  return { errors, warnings }
}
