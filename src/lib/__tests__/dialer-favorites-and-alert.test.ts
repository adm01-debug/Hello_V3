import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  moveItem,
  normalizePositions,
  diffPositions,
  reorderFavorites,
} from '@/lib/dialer-favorites-order';
import {
  startRingtone,
  showIncomingNotification,
  ensureNotificationPermission,
  startIncomingCallAlert,
  RING_CYCLE_MS,
} from '@/lib/incoming-call-alert';

const makeFavorites = (n: number) =>
  Array.from({ length: n }, (_, index) => ({ id: `fav-${index}`, position: index }));

describe('dialer-favorites-order — simulação de centenas de cenários', () => {
  it('preserva o conjunto de itens em qualquer movimento (PBT)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: -5, max: 20 }),
        fc.integer({ min: -5, max: 20 }),
        (size, from, to) => {
          const items = makeFavorites(size);
          const result = reorderFavorites(items, from, to);
          expect(result).toHaveLength(size);
          expect(new Set(result.map((item) => item.id)).size).toBe(size);
        },
      ),
      { numRuns: 500, seed: 42 },
    );
  });

  it('sempre gera posições densas 0..n-1 (PBT)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 12 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 0, max: 11 }),
        (size, from, to) => {
          const result = reorderFavorites(makeFavorites(size), from, to);
          result.forEach((item, index) => expect(item.position).toBe(index));
        },
      ),
      { numRuns: 500, seed: 7 },
    );
  });

  it('é imutável: nunca altera o array original', () => {
    const items = makeFavorites(5);
    const snapshot = JSON.stringify(items);
    reorderFavorites(items, 0, 4);
    moveItem(items, 1, 3);
    expect(JSON.stringify(items)).toBe(snapshot);
  });

  it.each([
    ['índice negativo', -1, 2],
    ['índice acima do tamanho', 0, 99],
    ['NaN', Number.NaN, 1],
    ['fracionário', 1.5, 2],
    ['mesma posição', 2, 2],
  ])('mantém a ordem com %s', (_label, from, to) => {
    const items = makeFavorites(5);
    expect(moveItem(items, from as number, to as number).map((i) => i.id)).toEqual(
      items.map((i) => i.id),
    );
  });

  it('lida com listas vazias e entradas não-array sem lançar', () => {
    expect(moveItem([], 0, 1)).toEqual([]);
    expect(normalizePositions(undefined as never)).toEqual([]);
    expect(diffPositions(undefined as never, undefined as never)).toEqual([]);
  });

  it('normaliza posições duplicadas ou com lacunas vindas do banco', () => {
    const corrupted = [
      { id: 'a', position: 5 },
      { id: 'b', position: 5 },
      { id: 'c', position: 99 },
    ];
    expect(normalizePositions(corrupted).map((i) => i.position)).toEqual([0, 1, 2]);
  });

  it('diffPositions retorna apenas as linhas realmente alteradas', () => {
    const items = makeFavorites(6);
    const reordered = reorderFavorites(items, 0, 1);
    const changes = diffPositions(items, reordered);
    expect(changes).toEqual([
      { id: 'fav-1', position: 0 },
      { id: 'fav-0', position: 1 },
    ]);
  });

  it('diffPositions é vazio quando nada muda (evita escrita no banco)', () => {
    const items = makeFavorites(8);
    expect(diffPositions(items, reorderFavorites(items, 3, 3))).toEqual([]);
  });

  it('mover para o fim e voltar restaura a ordem original (round-trip PBT)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 12 }), fc.integer({ min: 0, max: 11 }), (size, rawFrom) => {
        const items = makeFavorites(size);
        const from = rawFrom % size;
        const moved = reorderFavorites(items, from, size - 1);
        const back = reorderFavorites(moved, size - 1, from);
        expect(back.map((i) => i.id)).toEqual(items.map((i) => i.id));
      }),
      { numRuns: 300, seed: 11 },
    );
  });

  it('ignora entradas corrompidas sem id string em diffPositions', () => {
    const changes = diffPositions(
      [{ id: 'a', position: 0 }],
      [{ id: undefined as never, position: 0 }, { id: 'a', position: 1 }],
    );
    expect(changes).toEqual([{ id: 'a', position: 1 }]);
  });
});

describe('incoming-call-alert — resiliência de ambiente', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'AudioContext');
  });

  it('não lança quando AudioContext é indisponível', () => {
    const handle = startRingtone();
    expect(() => handle.stop()).not.toThrow();
    expect(() => handle.stop()).not.toThrow(); // idempotente
  });

  it('não lança quando o AudioContext falha ao ser construído', () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('bloqueado por política de autoplay');
        }
      },
    );
    expect(() => startRingtone().stop()).not.toThrow();
  });

  it('emite toques em cadência e para ao encerrar', () => {
    vi.useFakeTimers();
    const start = vi.fn();
    const createOscillator = vi.fn(() => ({
      type: '',
      frequency: { value: 0 },
      connect: (node: unknown) => node,
      start,
      stop: vi.fn(),
    }));
    const close = vi.fn();
    vi.stubGlobal(
      'AudioContext',
      class {
        state = 'running';
        currentTime = 0;
        destination = {};
        createOscillator = createOscillator;
        createGain = () => ({
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: (node: unknown) => node,
        });
        close = close;
      },
    );

    const handle = startRingtone();
    expect(start).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(RING_CYCLE_MS * 3);
    expect(start).toHaveBeenCalledTimes(4);

    handle.stop();
    vi.advanceTimersByTime(RING_CYCLE_MS * 5);
    expect(start).toHaveBeenCalledTimes(4);
    expect(close).toHaveBeenCalled();
  });

  it('não cria notificação sem permissão concedida', () => {
    const ctor = vi.fn();
    vi.stubGlobal('Notification', Object.assign(ctor, { permission: 'denied' }));
    const close = showIncomingNotification('Chamada', '+55 11 99999-0000');
    expect(ctor).not.toHaveBeenCalled();
    expect(() => close()).not.toThrow();
  });

  it('cria e fecha notificação quando permitido', () => {
    const close = vi.fn();
    const ctor = vi.fn(function NotificationMock(this: Record<string, unknown>) {
      this.close = close;
    });
    vi.stubGlobal('Notification', Object.assign(ctor, { permission: 'granted' }));
    const dispose = showIncomingNotification('Chamada recebida', 'Maria');
    expect(ctor).toHaveBeenCalledWith(
      'Chamada recebida',
      expect.objectContaining({ body: 'Maria', tag: 'incoming-call' }),
    );
    dispose();
    expect(close).toHaveBeenCalled();
  });

  it('ensureNotificationPermission devolve denied sem API e não re-pergunta', async () => {
    vi.stubGlobal('Notification', undefined);
    await expect(ensureNotificationPermission()).resolves.toBe('denied');

    const request = vi.fn();
    vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'granted', requestPermission: request }));
    await expect(ensureNotificationPermission()).resolves.toBe('granted');
    expect(request).not.toHaveBeenCalled();
  });

  it('startIncomingCallAlert é seguro e idempotente em ambiente sem APIs', () => {
    vi.stubGlobal('Notification', undefined);
    const alert = startIncomingCallAlert('Chamada recebida', 'Desconhecido');
    expect(() => {
      alert.stop();
      alert.stop();
    }).not.toThrow();
  });
});
