export function looksBrokenText(value?: string | null) {
  if (!value) return false
  const questionCount = (value.match(/\?/g) ?? []).length
  const replacementCount = (value.match(/�/g) ?? []).length
  const trimmed = value.replace(/[\s\dA-Za-z#·,:;()（）\-_/]/g, '')
  return questionCount >= 2 || replacementCount >= 1 || (trimmed.length > 0 && /^\?+$/.test(trimmed))
}

export function safeText(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  return looksBrokenText(value) ? fallback : value
}

export function safeList(values: string[] | null | undefined) {
  if (!values || values.length === 0) return []
  return values.filter((item) => item && !looksBrokenText(item))
}
