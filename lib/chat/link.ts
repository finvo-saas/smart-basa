export function chatWithPath(input: {
  userId?: string
  propertyId?: string
  propertyName?: string
}) {
  const params = new URLSearchParams()
  if (input.userId) params.set('userId', input.userId)
  if (input.propertyId) params.set('propertyId', input.propertyId)
  if (input.propertyName) params.set('propertyName', input.propertyName)
  const qs = params.toString()
  return qs ? `/messages?${qs}` : '/messages'
}
