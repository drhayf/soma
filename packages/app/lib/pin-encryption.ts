/**
 * PIN Encryption - Secure password storage using PIN as encryption key
 * Uses simple XOR cipher with PIN-derived key (React Native compatible)
 *
 * NOTE: This is device-local encryption only. The PIN never leaves the device.
 * Security relies on device security (biometrics, passcode lock).
 */

/**
 * Simple hash function for PIN verification
 * Uses multiple rounds of character code manipulation
 * @param pin - The PIN to hash
 * @returns Hashed PIN string
 */
export function hashPin(pin: string): string {
  const salt = 'somatic-alignment-pin-salt-2024'
  const combined = pin + salt
  let hash = 0

  // Multiple rounds of hashing
  for (let round = 0; round < 1000; round++) {
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char + round
      hash = hash & hash // Convert to 32bit integer
    }
  }

  // Convert to base36 string for storage
  return Math.abs(hash).toString(36)
}

/**
 * Verifies a PIN against a stored hash
 * @param pin - The PIN to verify
 * @param storedHash - The stored hash to check against
 * @returns True if PIN matches the hash
 */
export function verifyPinHash(pin: string, storedHash: string): boolean {
  const computedHash = hashPin(pin)
  return computedHash === storedHash
}

/**
 * Derives a repeating encryption key from the PIN
 * @param pin - The 4-digit PIN
 * @param length - Length of key to generate
 * @returns Derived key as number array
 */
function deriveKey(pin: string, length: number): number[] {
  const salt = 'somatic-alignment-2024'
  const seed = pin + salt
  const key: number[] = []

  for (let i = 0; i < length; i++) {
    const charCode = seed.charCodeAt(i % seed.length)
    const offset = i % 256
    key.push((charCode + offset) % 256)
  }

  return key
}

/**
 * Encrypts a password using the PIN as the encryption key
 * @param password - The password to encrypt
 * @param pin - The 4-digit PIN used as encryption key
 * @returns Encrypted password string (base64)
 */
export function encryptPassword(password: string, pin: string): string {
  const key = deriveKey(pin, password.length)
  const encrypted: number[] = []

  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i)
    const keyByte = key[i]
    encrypted.push(charCode ^ keyByte)
  }

  // Convert to base64
  const binary = String.fromCharCode(...encrypted)
  return btoa(binary)
}

/**
 * Decrypts a password using the PIN as the decryption key
 * @param encryptedPassword - The encrypted password string (base64)
 * @param pin - The 4-digit PIN used as decryption key
 * @returns Decrypted password, or null if decryption fails
 */
export function decryptPassword(encryptedPassword: string, pin: string): string | null {
  try {
    // Decode from base64
    const binary = atob(encryptedPassword)
    const encrypted: number[] = []
    for (let i = 0; i < binary.length; i++) {
      encrypted.push(binary.charCodeAt(i))
    }

    const key = deriveKey(pin, encrypted.length)
    const decrypted: number[] = []

    for (let i = 0; i < encrypted.length; i++) {
      const encryptedByte = encrypted[i]
      const keyByte = key[i]
      decrypted.push(encryptedByte ^ keyByte)
    }

    const password = String.fromCharCode(...decrypted)

    // Basic validation - password should be printable ASCII
    if (password.length === 0 || /[\x00-\x1F\x7F-\xFF]/.test(password)) {
      return null
    }

    return password
  } catch (error) {
    console.error('[PIN Encryption] Decryption failed:', error)
    return null
  }
}

/**
 * Verifies that a PIN can successfully decrypt the stored password
 * This is used to validate PIN entry without exposing the password
 */
export function verifyPinWithEncryptedPassword(pin: string, encryptedPassword: string): boolean {
  const decrypted = decryptPassword(encryptedPassword, pin)
  return decrypted !== null && decrypted.length > 0
}
