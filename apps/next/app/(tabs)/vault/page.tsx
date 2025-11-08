/**
 * Next.js Vault Page
 * Displays the Knowledge Vault using the shared component
 */

'use client'

import { YStack } from '@my/ui'
import { KnowledgeVault, knowledgeVaultTabs } from 'app'

export default function VaultPage() {
  return (
    <YStack pt={80}>
      <KnowledgeVault tabs={knowledgeVaultTabs} />
    </YStack>
  )
}
