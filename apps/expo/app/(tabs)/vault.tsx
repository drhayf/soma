/**
 * Expo Vault Screen
 * Displays the Knowledge Vault using the shared component
 */

import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from '@my/ui'
import { KnowledgeVault, knowledgeVaultTabs, FLOATING_NAV_HEIGHT } from 'app'

export default function VaultScreen() {
  const insets = useSafeAreaInsets()
  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: FLOATING_NAV_HEIGHT }}>
      <YStack paddingTop={topPadding}>
        <KnowledgeVault tabs={knowledgeVaultTabs} />
      </YStack>
    </ScrollView>
  )
}
