import 'react-native-get-random-values'
import 'setimmediate'

if (!global?.setImmediate) {
  global.setImmediate = setTimeout
}

import 'expo-router/entry'
