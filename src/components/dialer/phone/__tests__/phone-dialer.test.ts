import { describe, it, expect } from 'vitest';
import {
  sanitizeDialInput,
  formatPhoneDisplay,
  isDialable,
  formatDuration,
} from '@/components/dialer/phone/phone-utils';
import { parseVoiceIntent, extractDigits } from '@/components/voice/voice-intent';

describe('phone-utils', () => {
  it('sanitiza entrada removendo caracteres inválidos', () => {
    expect(sanitizeDialInput('(11) 98765-4321')).toBe('11987654321');
    expect(sanitizeDialInput('abc+55#*')).toBe('+55#*');
    expect(sanitizeDialInput('')).toBe('');
  });

  it('formata número BR no display', () => {
    expect(formatPhoneDisplay('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhoneDisplay('1133224455')).toBe('(11) 3322-4455');
    expect(formatPhoneDisplay('11')).toBe('11');
    expect(formatPhoneDisplay('+5511987654321')).toBe('+5511987654321');
  });

  it('valida se o número é discável', () => {
    expect(isDialable('12')).toBe(false);
    expect(isDialable('123')).toBe(true);
  });

  it('formata duração', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3671)).toBe('1:01:11');
    expect(formatDuration(Number.NaN)).toBe('00:00');
  });
});

describe('voice-intent', () => {
  it('extrai dígitos de palavras', () => {
    expect(extractDigits('um dois três')).toBe('123');
    expect(extractDigits('11 98765 4321')).toBe('11987654321');
  });

  it('reconhece comando de discagem', () => {
    const intent = parseVoiceIntent('Ligar para 11987654321');
    expect(intent.action).toBe('dial');
    expect(intent.target).toBe('11987654321');
  });

  it('reconhece comandos de controle', () => {
    expect(parseVoiceIntent('encerrar chamada').action).toBe('hangup');
    expect(parseVoiceIntent('ativar mudo').action).toBe('mute');
    expect(parseVoiceIntent('tirar o mudo').action).toBe('unmute');
    expect(parseVoiceIntent('repetir última chamada').action).toBe('redial');
    expect(parseVoiceIntent('abrir histórico').action).toBe('history');
  });

  it('retorna none para texto irreconhecível', () => {
    expect(parseVoiceIntent('bom dia tudo bem').action).toBe('none');
    expect(parseVoiceIntent('').action).toBe('none');
  });
});
