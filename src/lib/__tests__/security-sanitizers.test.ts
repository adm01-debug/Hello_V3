import { describe, it, expect, beforeEach } from 'vitest';
import {
  escapeHTML,
  stripHTMLTags,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeSearchQuery,
  isValidURL,
} from '@/lib/security/input-sanitizer';
import {
  containsSQLInjection,
  sanitizeSQLInput,
  validateIdentifier,
  escapeForLike,
} from '@/lib/security/sql-sanitizer';
import {
  sanitizeURL,
  sanitizeForAttribute,
  stripScriptTags,
  sanitizeEventHandlers,
  createSafeHTML,
} from '@/lib/security/xss-prevention';

describe('Input Sanitizer', () => {
  describe('escapeHTML', () => {
    it('escapes ampersands', () => expect(escapeHTML('a&b')).toContain('&amp;'));
    it('escapes less-than', () => expect(escapeHTML('<div>')).toContain('&lt;'));
    it('escapes greater-than', () => expect(escapeHTML('a>b')).toContain('&gt;'));
    it('escapes double quotes', () => expect(escapeHTML('"hello"')).toContain('&quot;'));
    it('escapes single quotes', () => expect(escapeHTML("'test'")).toContain('&#x27;'));
    it('escapes backticks', () => expect(escapeHTML('`code`')).toContain('&#96;'));
    it('escapes forward slashes', () => expect(escapeHTML('a/b')).toContain('&#x2F;'));
    it('returns empty string for empty input', () => expect(escapeHTML('')).toBe(''));
    it('does not modify safe strings', () => expect(escapeHTML('hello world 123')).toBe('hello world 123'));
    it('handles multiple special chars', () => {
      const result = escapeHTML('<script>"alert(1)"</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
    });
  });

  describe('stripHTMLTags', () => {
    it('removes simple tags', () => expect(stripHTMLTags('<b>bold</b>')).toBe('bold'));
    it('removes nested tags', () => expect(stripHTMLTags('<div><p>text</p></div>')).toBe('text'));
    it('removes script tags', () => expect(stripHTMLTags('<script>alert(1)</script>')).toBe('alert(1)'));
    it('removes self-closing tags', () => expect(stripHTMLTags('text<br/>more')).toBe('textmore'));
    it('handles tags with attributes', () => expect(stripHTMLTags('<a href="x">link</a>')).toBe('link'));
    it('preserves text without tags', () => expect(stripHTMLTags('no tags here')).toBe('no tags here'));
    it('handles empty string', () => expect(stripHTMLTags('')).toBe(''));
  });

  describe('sanitizeInput', () => {
    it('trims and strips tags and escapes', () => {
      const result = sanitizeInput('  <b>test</b>  ');
      expect(result).not.toContain('<');
      expect(result).toBe('test');
    });
    it('handles XSS payloads', () => {
      const result = sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeEmail', () => {
    it('lowercases email', () => expect(sanitizeEmail('Test@EXAMPLE.com')).toBe('test@example.com'));
    it('trims whitespace', () => expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com'));
    it('removes invalid characters', () => expect(sanitizeEmail('test<>@example.com')).toBe('test@example.com'));
    it('preserves valid email characters', () => expect(sanitizeEmail('user+tag@example.co')).toBe('user+tag@example.co'));
    it('handles dots and hyphens', () => expect(sanitizeEmail('a.b-c@d.e')).toBe('a.b-c@d.e'));
  });

  describe('sanitizePhoneNumber', () => {
    it('preserves digits', () => expect(sanitizePhoneNumber('1234567890')).toBe('1234567890'));
    it('preserves plus sign', () => expect(sanitizePhoneNumber('+5511999')).toBe('+5511999'));
    it('preserves parentheses and hyphens', () => expect(sanitizePhoneNumber('(11) 9999-0000')).toBe('(11) 9999-0000'));
    it('removes letters', () => expect(sanitizePhoneNumber('123abc456')).toBe('123456'));
    it('removes special chars', () => expect(sanitizePhoneNumber('12#3$4%5')).toBe('12345'));
  });

  describe('sanitizeSearchQuery', () => {
    it('removes angle brackets', () => expect(sanitizeSearchQuery('<script>')).not.toContain('<'));
    it('removes quotes and semicolons', () => {
      const result = sanitizeSearchQuery("'; DROP TABLE--");
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
    });
    it('truncates to 200 chars', () => {
      const long = 'a'.repeat(300);
      expect(sanitizeSearchQuery(long).length).toBe(200);
    });
    it('trims whitespace', () => expect(sanitizeSearchQuery('  test  ')).toBe('test'));
  });

  describe('isValidURL', () => {
    it('accepts http URLs', () => expect(isValidURL('http://example.com')).toBe(true));
    it('accepts https URLs', () => expect(isValidURL('https://example.com')).toBe(true));
    it('rejects javascript: URLs', () => expect(isValidURL('javascript:alert(1)')).toBe(false));
    it('rejects data: URLs', () => expect(isValidURL('data:text/html,<h1>test</h1>')).toBe(false));
    it('rejects ftp: URLs', () => expect(isValidURL('ftp://example.com')).toBe(false));
    it('rejects invalid URLs', () => expect(isValidURL('not a url')).toBe(false));
    it('rejects empty strings', () => expect(isValidURL('')).toBe(false));
  });
});

describe('SQL Sanitizer', () => {
  describe('containsSQLInjection', () => {
    it('detects SELECT statement', () => expect(containsSQLInjection('SELECT * FROM users')).toBe(true));
    it('detects DROP TABLE', () => expect(containsSQLInjection("'; DROP TABLE users--")).toBe(true));
    it('detects UNION injection', () => expect(containsSQLInjection("1 UNION SELECT 1,2,3")).toBe(true));
    it('detects comment syntax', () => expect(containsSQLInjection('test /* comment */')).toBe(true));
    it('detects OR keyword', () => expect(containsSQLInjection("admin' OR 1=1")).toBe(true));
    it('allows normal text', () => expect(containsSQLInjection('hello world')).toBe(false));
    it('allows numbers', () => expect(containsSQLInjection('12345')).toBe(false));
    it('allows emails', () => expect(containsSQLInjection('user@example.com')).toBe(false));
  });

  describe('sanitizeSQLInput', () => {
    it('escapes single quotes', () => expect(sanitizeSQLInput("O'Brien")).toBe("O''Brien"));
    it('escapes backslashes', () => expect(sanitizeSQLInput('path\\file')).toBe('path\\\\file'));
    it('removes null bytes', () => expect(sanitizeSQLInput('test\x00data')).toBe('testdata'));
    it('trims whitespace', () => expect(sanitizeSQLInput('  test  ')).toBe('test'));
  });

  describe('validateIdentifier', () => {
    it('accepts valid identifiers', () => expect(validateIdentifier('table_name')).toBe(true));
    it('accepts underscored names', () => expect(validateIdentifier('_private')).toBe(true));
    it('rejects names starting with number', () => expect(validateIdentifier('1table')).toBe(false));
    it('rejects names with spaces', () => expect(validateIdentifier('my table')).toBe(false));
    it('rejects names with special chars', () => expect(validateIdentifier('table;drop')).toBe(false));
    it('rejects empty string', () => expect(validateIdentifier('')).toBe(false));
  });

  describe('escapeForLike', () => {
    it('escapes percent sign', () => expect(escapeForLike('100%')).toBe('100\\%'));
    it('escapes underscore', () => expect(escapeForLike('user_name')).toBe('user\\_name'));
    it('does not modify normal text', () => expect(escapeForLike('hello')).toBe('hello'));
    it('escapes multiple wildcards', () => expect(escapeForLike('%_test_%')).toBe('\\%\\_test\\_\\%'));
  });
});

describe('XSS Prevention', () => {
  describe('sanitizeURL', () => {
    it('blocks javascript: protocol', () => expect(sanitizeURL('javascript:alert(1)')).toBe('#'));
    it('blocks data: protocol', () => expect(sanitizeURL('data:text/html,test')).toBe('#'));
    it('blocks vbscript: protocol', () => expect(sanitizeURL('vbscript:test')).toBe('#'));
    it('allows https: URLs', () => expect(sanitizeURL('https://example.com')).toBe('https://example.com'));
    it('allows relative URLs', () => expect(sanitizeURL('/path/to/page')).toBe('/path/to/page'));
    it('is case insensitive', () => expect(sanitizeURL('JAVASCRIPT:alert(1)')).toBe('#'));
  });

  describe('sanitizeForAttribute', () => {
    it('escapes quotes in attributes', () => {
      const result = sanitizeForAttribute('value"with"quotes');
      expect(result).toContain('&quot;');
    });
    it('escapes angle brackets', () => {
      const result = sanitizeForAttribute('<script>');
      expect(result).not.toContain('<');
    });
    it('escapes ampersands', () => {
      expect(sanitizeForAttribute('a&b')).toContain('&amp;');
    });
  });

  describe('stripScriptTags', () => {
    it('removes inline scripts', () => {
      expect(stripScriptTags('<p>hello</p><script>alert(1)</script>')).toBe('<p>hello</p>');
    });
    it('removes scripts with attributes', () => {
      expect(stripScriptTags('<script src="evil.js"></script>')).toBe('');
    });
    it('preserves non-script HTML', () => {
      expect(stripScriptTags('<div>safe</div>')).toBe('<div>safe</div>');
    });
  });

  describe('sanitizeEventHandlers', () => {
    it('removes onclick', () => {
      const result = sanitizeEventHandlers('<div onclick="alert(1)">test</div>');
      expect(result).not.toContain('onclick');
    });
    it('removes onmouseover', () => {
      const result = sanitizeEventHandlers('<img onmouseover="hack()">');
      expect(result).not.toContain('onmouseover');
    });
    it('removes onerror', () => {
      const result = sanitizeEventHandlers('<img onerror="alert(1)">');
      expect(result).not.toContain('onerror');
    });
  });

  describe('createSafeHTML', () => {
    it('removes both scripts and event handlers', () => {
      const dirty = '<div onclick="x"><script>alert(1)</script><p>safe</p></div>';
      const result = createSafeHTML(dirty);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>safe</p>');
    });
  });
});
