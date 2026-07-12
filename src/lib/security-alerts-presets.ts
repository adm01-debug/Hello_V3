/**
 * Presets salvos de filtros da página /admin/security-alerts.
 * Persistidos em localStorage; escopo por usuário implícito pelo device/browser.
 *
 * Não usa Supabase — mantém a UX offline-first e sem custo de RTT.
 */

const STORAGE_KEY = "security-alerts:filter-presets:v1";
const MAX_PRESETS = 20;

export type AlertFilterPreset = {
  id: string;
  name: string;
  source: string; // "__all__" ou source_type específico
  q: string; // termo de busca
  createdAt: string; // ISO
};

function isValidPreset(v: unknown): v is AlertFilterPreset {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.source === "string" &&
    typeof p.q === "string" &&
    typeof p.createdAt === "string"
  );
}

export function loadPresets(): AlertFilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPreset);
  } catch {
    return [];
  }
}

function savePresets(list: AlertFilterPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_PRESETS)));
  } catch {
    // Quota exceeded / storage disabled — silencioso.
  }
}

export function addPreset(input: { name: string; source: string; q: string }): AlertFilterPreset {
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error("Nome do preset é obrigatório");
  const list = loadPresets();
  // Dedupe por nome (case-insensitive) — sobrescreve mantendo o id original.
  const existing = list.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const now = new Date().toISOString();
  const preset: AlertFilterPreset = existing
    ? { ...existing, source: input.source, q: input.q, createdAt: now }
    : {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        source: input.source,
        q: input.q,
        createdAt: now,
      };
  const next = existing
    ? list.map((p) => (p.id === existing.id ? preset : p))
    : [preset, ...list];
  savePresets(next);
  return preset;
}

export function removePreset(id: string): void {
  savePresets(loadPresets().filter((p) => p.id !== id));
}
