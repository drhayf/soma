/**
 * Keyboard Dismiss Button
 * Clean floating circular button that appears above the keyboard
 * Minimal, non-intrusive design
 */

import { Platform, Keyboard, KeyboardEvent } from 'react-native'
import { Button, YStack } from '@my/ui'
import { X } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'

export function KeyboardDismissButton() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height)
    })
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  if (keyboardHeight === 0 || Platform.OS !== 'ios') return null

  return (
    <YStack position="absolute" bottom={keyboardHeight + 8} right={16} zIndex={9999}>
      <Button
        size="$3"
        circular
        icon={X}
        onPress={Keyboard.dismiss}
        backgroundColor="blue"
        chromeless={false}
        pressStyle={{ scale: 0.9, opacity: 0.8 }}
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.25}
        shadowRadius={4}
        elevation={5}
      />
    </YStack>
  )
}
