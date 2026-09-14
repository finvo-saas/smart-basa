/** First letter of each word, up to 3 words. */
export function nameInitials(name: string, maxWords = 3) {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, maxWords)
  if (!words.length) return '?'
  return words.map(word => word.charAt(0).toUpperCase()).join('')
}
