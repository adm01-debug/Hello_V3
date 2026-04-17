import { describe, it, expect } from 'vitest';
import { detectLanguage, langLabel, langFlag, toLocale } from '../language-detection';

describe('language-detection', () => {
  it('detects Portuguese with diacritics', () => {
    const r = detectLanguage('Bom dia, você está com problema na conexão?');
    expect(r.lang).toBe('pt');
    expect(r.confidence).toBeGreaterThan(0);
  });
  it('detects English stopwords', () => {
    const r = detectLanguage('Thank you for the help with this issue please');
    expect(r.lang).toBe('en');
  });
  it('detects Spanish via ñ', () => {
    const r = detectLanguage('Buenos días señor, ¿cómo está usted?');
    expect(r.lang).toBe('es');
  });
  it('detects German via umlaut', () => {
    const r = detectLanguage('Guten Tag, können Sie mir bitte helfen über das Problem');
    expect(r.lang).toBe('de');
  });
  it('detects Japanese via hiragana', () => {
    const r = detectLanguage('こんにちは、お元気ですか');
    expect(r.lang).toBe('ja');
    expect(r.confidence).toBeGreaterThan(0.9);
  });
  it('detects Chinese via han', () => {
    const r = detectLanguage('你好，今天天气很好');
    expect(r.lang).toBe('zh');
  });
  it('returns 0 confidence on too-short input', () => {
    expect(detectLanguage('').confidence).toBe(0);
    expect(detectLanguage('a').confidence).toBe(0);
  });
  it('langLabel and langFlag map known codes', () => {
    expect(langLabel('pt')).toBe('Português');
    expect(langFlag('ja')).toBe('🇯🇵');
    expect(langLabel('xx')).toBe('xx');
  });
  it('toLocale maps lang codes to locale strings', () => {
    expect(toLocale('ja')).toBe('ja-JP');
    expect(toLocale('en')).toBe('en-US');
    expect(toLocale('zz')).toBe('zz');
  });
});
