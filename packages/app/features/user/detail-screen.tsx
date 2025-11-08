import { Button, Paragraph, YStack } from '@my/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { semanticColors } from '../../lib/theme-colors'

export function UserDetailScreen({ id }: { id: string }) {
  const router = useRouter()
  if (!id) {
    return null
  }
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      gap="$4"
      backgroundColor="$background"
    >
      <Paragraph
        textAlign="center"
        fontWeight="700"
        color={semanticColors.primary.text}
      >{`User ID: ${id}`}</Paragraph>
      <Button icon={ChevronLeft} onPress={() => router.back()}>
        Go Home
      </Button>
    </YStack>
  )
}
