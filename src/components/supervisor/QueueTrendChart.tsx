import { useQueueMetrics } from '@/hooks/useQueueMetrics';

export function QueueTrendChart() {
  const { realtimeData, loading } = useQueueMetrics();

  const maxValue = Math.max(
    ...realtimeData.map((d) => Math.max(d.waitingCalls, d.activeCalls)),
    1
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-warning" /> Em espera
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-primary" /> Ativas
        </span>
      </div>
      {loading || realtimeData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
          Aguardando dados de chamadas em tempo real…
        </div>
      ) : (
        <div className="flex items-end gap-1 h-32">
          {realtimeData.map((point, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex flex-col-reverse gap-0.5">
                <div
                  className="w-full bg-primary rounded-t-sm"
                  style={{ height: `${(point.activeCalls / maxValue) * 100}px` }}
                />
                <div
                  className="w-full bg-warning rounded-t-sm"
                  style={{ height: `${(point.waitingCalls / maxValue) * 60}px` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {point.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
