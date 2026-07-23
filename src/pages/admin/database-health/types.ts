export type BloatRow = {
  schemaname: string;
  relname: string;
  dead_tuples: number;
  live_tuples: number;
  dead_ratio: number;
};

export type TopTable = {
  relname: string;
  total_bytes: number;
  heap_bytes: number;
  index_bytes: number;
  live_tuples: number | null;
  dead_tuples: number | null;
};

export type SlowQuery = {
  query: string;
  calls: number;
  mean_ms: number;
  total_ms: number;
  max_ms: number;
};

export type IdleIndex = {
  schemaname: string;
  relname: string;
  indexrelname: string;
  index_size_bytes: number;
  index_size_pretty: string;
};

export type IndexDropAuditRow = {
  id: string;
  index_name: string;
  table_name: string;
  admin_email: string | null;
  action: "copy" | "execute";
  created_at: string;
};

export interface Snapshot {
  generated_at: string;
  bloat: BloatRow[];
  top_tables: TopTable[];
  activity: {
    total_connections: number;
    active: number;
    idle: number;
    idle_in_txn: number;
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}
