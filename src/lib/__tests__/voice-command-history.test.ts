import { describe, expect, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  MAX_COMMAND_LENGTH,
  MAX_HISTORY_ENTRIES,
  clearCommandHistory,
  loadCommandHistory,
  pushCommandHistory,
  sanitizeCommand,
} from '../voice-command-history';

beforeEach(() => {
  window.localStorage.clear();
});

describe('voice-command-history', () => {
  it('sanitiza qualquer entrada sem lançar e respeita o limite de tamanho', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const result = sanitizeCommand(value);
        expect(typeof result).toBe('string');
        expect(result.length).toBeLessThanOrEqual(MAX_COMMAND_LENGTH);
        expect(result).toBe(result.trim());
      }),
      { numRuns: 500 },
    );
  });

  it('nunca excede o número máximo de entradas', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 40 }), (commands) => {
        clearCommandHistory('u1');
        for (const command of commands) pushCommandHistory('u1', command);
        expect(loadCommandHistory('u1').length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES);
      }),
      { numRuns: 300 },
    );
  });

  it('faz dedupe case-insensitive mantendo o comando no topo', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }).filter((s) => sanitizeCommand(s).length > 0), (command) => {
        clearCommandHistory('u2');
        pushCommandHistory('u2', command);
        pushCommandHistory('u2', 'outro comando');
        pushCommandHistory('u2', command.toUpperCase());
        const history = loadCommandHistory('u2');
        const sanitized = sanitizeCommand(command).toLowerCase();
        const matches = history.filter((entry) => entry.command.toLowerCase() === sanitized);
        expect(matches.length).toBe(1);
        expect(history[0].command.toLowerCase()).toBe(sanitized);
      }),
      { numRuns: 300 },
    );
  });

  it('isola escopos por usuário', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => sanitizeCommand(s).length > 0),
        (command) => {
          clearCommandHistory('a');
          clearCommandHistory('b');
          pushCommandHistory('a', command);
          expect(loadCommandHistory('b')).toEqual([]);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('ignora comandos vazios', () => {
    clearCommandHistory('u3');
    pushCommandHistory('u3', '   ');
    pushCommandHistory('u3', null);
    expect(loadCommandHistory('u3')).toEqual([]);
  });

  it('degrada com segurança quando o storage contém JSON inválido', () => {
    window.localStorage.setItem('voice:command-history:v1:u4', '{{{not json');
    expect(loadCommandHistory('u4')).toEqual([]);
    expect(() => pushCommandHistory('u4', 'ligar para 1199')).not.toThrow();
    expect(loadCommandHistory('u4')[0]?.command).toBe('ligar para 1199');
  });

  it('descarta entradas corrompidas do array persistido', () => {
    window.localStorage.setItem(
      'voice:command-history:v1:u5',
      JSON.stringify([null, 42, { command: '' }, { command: 'ok', at: 'x' }]),
    );
    const history = loadCommandHistory('u5');
    expect(history).toHaveLength(1);
    expect(history[0].command).toBe('ok');
    expect(Number.isFinite(history[0].at)).toBe(true);
  });
});
