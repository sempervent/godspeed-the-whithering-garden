export interface ParsedTags {
  text: string
  tags: string[]
}

const TAG_PATTERN = /\[(soft|loud|loop|mirror)\]/gi

export function parseTags(text: string): ParsedTags {
  const tags: string[] = []
  let cleanText = text

  // Extract tags
  const matches = text.matchAll(TAG_PATTERN)
  for (const match of matches) {
    const tag = match[1].toLowerCase()
    if (!tags.includes(tag)) {
      tags.push(tag)
    }
  }

  // Remove tags from text
  cleanText = text.replace(TAG_PATTERN, '').trim()

  return {
    text: cleanText,
    tags
  }
}

export function hasTag(text: string, tag: string): boolean {
  const parsed = parseTags(text)
  return parsed.tags.includes(tag.toLowerCase())
}

export function stripTags(text: string): string {
  return parseTags(text).text
}

export function getTags(text: string): string[] {
  return parseTags(text).tags
}
