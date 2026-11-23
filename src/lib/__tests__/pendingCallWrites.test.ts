import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as pcw from '../pendingCallWrites';

describe('pendingCallWrites', () => {
  beforeEach(() => pcw.clear());
  afterEach(() => pcw.clear());

  it('enfileira e retira em ordem FIFO', () => {
    pcw.enqueue({ sessionId: 'a', durationSeconds: 10 });
    pcw.enqueue({ sessionId: 'b', durationSeconds: 20 });
    expect(pcw.count()).toBe(2);
    expect(pcw.dequeue()?.sessionId).toBe('a');
    expect(pcw.dequeue()?.sessionId).toBe('b');
    expect(pcw.dequeue()).toBeNull();
  });

  it('descarta o mais antigo quando chega a 20 itens', () => {
    for (let i = 0; i < 20; i++) pcw.enqueue({ sessionId: `s${i}`, durationSeconds: i });
    expect(pcw.count()).toBe(20);
    // adicionar o item 21 deve descartar o mais antigo (s0)
    pcw.enqueue({ sessionId: 's20', durationSeconds: 20 });
    expect(pcw.count()).toBe(20);
    expect(pcw.dequeue()?.sessionId).toBe('s1'); // s0 foi descartado
    // o ultimo deve ser s20
    for (let i = 0; i < 18; i++) pcw.dequeue();
    expect(pcw.dequeue()?.sessionId).toBe('s20');
  });

  it('clear() esvazia a fila', () => {
    pcw.enqueue({ sessionId: 'x', durationSeconds: 5 });
    pcw.clear();
    expect(pcw.count()).toBe(0);
  });
});