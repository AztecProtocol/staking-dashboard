import React from 'react'

/**
 * Applies italic styling to specific characters in a string based on a deterministic pattern
 * @param text - The text to style
 * @param italicRatio - Ratio of characters to italicize (default 0.3 = 30%)
 * @param startOffset - Where to start italicizing as a ratio of word length (default 0.4 = 40% into the word)
 */
export function applyItalicStyling(
  text: string,
  italicRatio: number = 0.3,
  startOffset: number = 0.4
): React.ReactNode {
  const words = text.split(' ')

  return words.map((word, wordIndex) => {
    // Skip short words (3 characters or less)
    if (word.length <= 3) {
      return (
        <React.Fragment key={wordIndex}>
          {wordIndex > 0 && ' '}
          {word}
        </React.Fragment>
      )
    }

    // Calculate which characters to italicize
    const startIdx = Math.floor(word.length * startOffset)
    const italicLength = Math.max(2, Math.ceil(word.length * italicRatio))
    const endIdx = Math.min(startIdx + italicLength, word.length - 1)

    // Split word into parts
    const beforeItalic = word.slice(0, startIdx)
    const italicPart = word.slice(startIdx, endIdx)
    const afterItalic = word.slice(endIdx)

    return (
      <React.Fragment key={wordIndex}>
        {wordIndex > 0 && ' '}
        {beforeItalic}
        <em className="font-arizona-serif-italic">{italicPart}</em>
        {afterItalic}
      </React.Fragment>
    )
  })
}

/**
 * Alternative: Apply italic based on character position pattern
 * This creates a more consistent visual rhythm
 */
export function applyRhythmicItalics(text: string): React.ReactNode {
  const words = text.split(' ')

  return words.map((word, wordIndex) => {
    const chars = word.split('')

    return (
      <React.Fragment key={wordIndex}>
        {wordIndex > 0 && ' '}
        {chars.map((char, charIndex) => {
          // Pattern: italicize every 3rd and 4th character in words longer than 4 chars
          const shouldItalicize = word.length > 4 &&
            (charIndex === 2 || charIndex === 3 || charIndex === 4)

          if (shouldItalicize) {
            return <em key={charIndex} className="font-arizona-serif-italic">{char}</em>
          }
          return char
        })}
      </React.Fragment>
    )
  })
}

/**
 * Hero-style italic application - more artistic placement
 * Italicizes middle portions of longer words for visual interest
 */
export function applyHeroItalics(text: string): React.ReactNode {
  const words = text.split(' ')

  return words.map((word, wordIndex) => {
    // Only apply to words with 5+ characters
    if (word.length < 5) {
      return (
        <React.Fragment key={wordIndex}>
          {wordIndex > 0 && ' '}
          {word}
        </React.Fragment>
      )
    }

    // For longer words, italicize the middle portion
    const startIdx = Math.floor((word.length - 1) * 0.35)
    const endIdx = Math.floor((word.length - 1) * 0.65)

    const beforeItalic = word.slice(0, startIdx)
    const italicPart = word.slice(startIdx, endIdx + 1)
    const afterItalic = word.slice(endIdx + 1)

    return (
      <React.Fragment key={wordIndex}>
        {wordIndex > 0 && ' '}
        {beforeItalic}
        <em className="font-arizona-serif-italic">{italicPart}</em>
        {afterItalic}
      </React.Fragment>
    )
  })
}