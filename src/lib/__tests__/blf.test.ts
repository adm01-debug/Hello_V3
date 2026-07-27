import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  agentKey,
  buildLampBoard,
  elapsedFrom,
  filterLamps,
  formatElapsed,
  maskPhone,
  safeText,
  sortLamps,
  summarizeLamps,
  LAMP_PRIORITY,
  type BlfAgentRow,
  type BlfParkedRow,
  type BlfSessionRow,
} from '@/lib/blf';

const NOW = Date.parse('2026-07-27T12:00:00.000Z');

const agent = (over: Partial<BlfAgentRow> = {}): BlfAgentRow => ({
  id: 'a1',
  name: 'João Silva',
  extension: '1001',
  status: 'available',
  department: 'Vendas',
  avatar_url: null,
  ...over,
});

describe('blf: helpers puros', () => {
  it('safeText normaliza tipos inesperados', () => {
    expect(safeText('  oi ')).toBe('oi');
    expect(safeText('   ')).toBeNull();
    expect(safeText(42)).toBe('42');
    expect(safeText(Number.NaN)).toBeNull();
    expect(safeText(null)).toBeNull();
    expect(safeText({} as unknown)).toBeNull();
  });

  it('agentKey ignora acentos, caixa e espaços múltiplos', () => {
    expect(agentKey('  JOÃO   Silva ')).toBe('joao silva');
    expect(agentKey('joao silva')).toBe(agentKey('João  Silva'));
  });

  it('maskPhone preserva no máximo os 4 últimos dígitos', () => {
    expect(maskPhone('+55 (11) 98765-4321')).toBe('****4321');
    expect(maskPhone('12')).toBe('12');
    expect(maskPhone('abc')).toBeNull();
  });

  it('elapsedFrom nunca retorna negativo e rejeita datas inválidas', () => {
    expect(elapsedFrom(new Date(NOW - 65_000).toISOString(), NOW)).toBe(65);
    expect(elapsedFrom(new Date(NOW + 60_000).toISOString(), NOW)).toBe(0);
    expect(elapsedFrom('não-é-data', NOW)).toBeNull();
  });

  it('formatElapsed cobre horas e valores inválidos', () => {
    expect(formatElapsed(65)).toBe('01:05');
    expect(formatElapsed(3725)).toBe('1:02:05');
    expect(formatElapsed(null)).toBe('--:--');
    expect(formatElapsed(-1)).toBe('--:--');
  });
});

describe('blf: construção do mural', () => {
  it('prioriza ringing sobre talking e hold', () => {
    const sessions: BlfSessionRow[] = [
      {
        id: 's1',
        agent_name: 'joão silva',
        caller_name: 'Cliente A',
        caller_phone: '11987654321',
        status: 'active',
        direction: 'inbound',
        started_at: new Date(NOW - 30_000).toISOString(),
      },
      {
        id: 's2',
        agent_name: 'JOAO SILVA',
        caller_name: 'Cliente B',
        caller_phone: null,
        status: 'ringing',
        direction: 'inbound',
        started_at: new Date(NOW - 5_000).toISOString(),
      },
    ];
    const [lamp] = buildLampBoard([agent()], sessions, [], NOW);
    expect(lamp.state).toBe('ringing');
    expect(lamp.sessionId).toBe('s2');
    expect(lamp.elapsedSeconds).toBe(5);
  });

  it('usa chamada estacionada quando não há sessão ativa', () => {
    const parked: BlfParkedRow[] = [
      {
        id: 'p1',
        slot_number: 7,
        contact_name: 'Maria',
        contact_phone: '11912345678',
        parked_at: new Date(NOW - 120_000).toISOString(),
        status: 'parked',
        parked_by_name: 'João Silva',
      },
    ];
    const [lamp] = buildLampBoard([agent()], [], parked, NOW);
    expect(lamp.state).toBe('parked');
    expect(lamp.parkedSlot).toBe(7);
    expect(lamp.detail).toBe('Maria • ****5678');
  });

  it('ignora chamadas já retiradas', () => {
    const parked: BlfParkedRow[] = [
      {
        id: 'p1',
        slot_number: 7,
        contact_name: 'Maria',
        contact_phone: null,
        parked_at: new Date(NOW - 10_000).toISOString(),
        status: 'retrieved',
        parked_by_name: 'João Silva',
      },
    ];
    const [lamp] = buildLampBoard([agent()], [], parked, NOW);
    expect(lamp.state).toBe('available');
  });

  it('mapeia status declarado quando não há eventos', () => {
    expect(buildLampBoard([agent({ status: 'busy' })], [], [], NOW)[0].state).toBe('talking');
    expect(buildLampBoard([agent({ status: 'away' })], [], [], NOW)[0].state).toBe('away');
    expect(buildLampBoard([agent({ status: null })], [], [], NOW)[0].state).toBe('offline');
    expect(buildLampBoard([agent({ status: 'xyz' })], [], [], NOW)[0].state).toBe('offline');
  });

  it('descarta agentes sem id e sessões órfãs', () => {
    const lamps = buildLampBoard(
      [agent(), { ...agent({ id: '' }), name: 'Fantasma' }],
      [
        {
          id: 's9',
          agent_name: null,
          caller_name: null,
          caller_phone: null,
          status: 'active',
          direction: null,
          started_at: null,
        },
      ],
      [],
      NOW,
    );
    expect(lamps).toHaveLength(1);
    expect(lamps[0].state).toBe('available');
  });
});

describe('blf: ordenação, filtro e resumo', () => {
  it('ordena por criticidade e depois por ramal numérico', () => {
    const lamps = buildLampBoard(
      [
        agent({ id: 'a', name: 'Ana', extension: '20', status: 'available' }),
        agent({ id: 'b', name: 'Bruno', extension: '3', status: 'available' }),
        agent({ id: 'c', name: 'Caio', extension: '9', status: 'offline' }),
      ],
      [],
      [],
      NOW,
    );
    const sorted = sortLamps(lamps).map((l) => l.extension);
    expect(sorted).toEqual(['3', '20', '9']);
  });

  it('filtra por texto sem acento e por estado', () => {
    const lamps = buildLampBoard(
      [
        agent({ id: 'a', name: 'Ana Paula', extension: '10' }),
        agent({ id: 'b', name: 'Bruno', extension: '11', status: 'offline' }),
      ],
      [],
      [],
      NOW,
    );
    expect(filterLamps(lamps, 'ANA').map((l) => l.agentId)).toEqual(['a']);
    expect(filterLamps(lamps, '', 'offline').map((l) => l.agentId)).toEqual(['b']);
    expect(filterLamps(lamps, 'vendas')).toHaveLength(2);
  });

  it('calcula ocupação apenas sobre ramais online', () => {
    const lamps = buildLampBoard(
      [
        agent({ id: 'a', name: 'A', extension: '1', status: 'busy' }),
        agent({ id: 'b', name: 'B', extension: '2', status: 'available' }),
        agent({ id: 'c', name: 'C', extension: '3', status: 'offline' }),
      ],
      [],
      [],
      NOW,
    );
    const summary = summarizeLamps(lamps);
    expect(summary.total).toBe(3);
    expect(summary.occupancyPercent).toBe(50);
    expect(summarizeLamps([]).occupancyPercent).toBe(0);
  });
});

describe('blf: propriedades (PBT)', () => {
  it('mural sempre tem uma lâmpada por agente válido', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string(),
            extension: fc.string(),
            status: fc.option(fc.string(), { nil: null }),
            department: fc.option(fc.string(), { nil: null }),
            avatar_url: fc.constant(null),
          }),
          { maxLength: 25 },
        ),
        (agents) => {
          const board = buildLampBoard(agents as BlfAgentRow[], [], [], NOW);
          const valid = agents.filter((a) => safeText(a.id) !== null).length;
          expect(board).toHaveLength(valid);
          for (const lamp of board) {
            expect(lamp.name.length).toBeGreaterThan(0);
            expect(lamp.extension.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 400 },
    );
  });

  it('ordenação é estável quanto à prioridade dos estados', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            extension: fc.string({ minLength: 1 }),
            status: fc.constantFrom('available', 'busy', 'away', 'offline'),
            department: fc.constant(null),
            avatar_url: fc.constant(null),
          }),
          { maxLength: 30 },
        ),
        (agents) => {
          const sorted = sortLamps(buildLampBoard(agents as BlfAgentRow[], [], [], NOW));
          for (let i = 1; i < sorted.length; i += 1) {
            expect(LAMP_PRIORITY[sorted[i - 1].state]).toBeLessThanOrEqual(
              LAMP_PRIORITY[sorted[i].state],
            );
          }
        },
      ),
      { numRuns: 400 },
    );
  });

  it('resumo soma exatamente o total e nunca extrapola 100% de ocupação', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            extension: fc.string({ minLength: 1 }),
            status: fc.constantFrom('available', 'busy', 'away', 'offline', 'lixo'),
            department: fc.constant(null),
            avatar_url: fc.constant(null),
          }),
          { maxLength: 30 },
        ),
        (agents) => {
          const summary = summarizeLamps(buildLampBoard(agents as BlfAgentRow[], [], [], NOW));
          const sum =
            summary.talking +
            summary.ringing +
            summary.hold +
            summary.parked +
            summary.available +
            summary.away +
            summary.offline;
          expect(sum).toBe(summary.total);
          expect(summary.occupancyPercent).toBeGreaterThanOrEqual(0);
          expect(summary.occupancyPercent).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 400 },
    );
  });

  it('mascaramento nunca vaza mais que 4 dígitos', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const masked = maskPhone(raw);
        if (masked === null) return;
        expect(masked.replace(/\D/g, '').length).toBeLessThanOrEqual(4);
      }),
      { numRuns: 400 },
    );
  });
});
