import { describe, it, expect } from 'vitest'
import { InputSanitizer } from '@/lib/security/input-sanitizer'

describe('InputSanitizer', () => {
  it('sanitizes HTML', () => {
    expect(InputSanitizer.sanitizeString('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })
  
  it('sanitizes email', () => {
    expect(InputSanitizer.sanitizeEmail('Test@Example.COM'))
      .toBe('test@example.com')
  })
})
