import { useCallback, useState } from "react";
import { useDebouncedSearchParam } from "@/hooks/useDebouncedSearchParam";
import { useSearchParams } from "react-router-dom";
import { KpiStrip } from "@/components/security-alerts/KpiStrip";
import { AlertsDailyChart } from "@/components/security-alerts/AlertsDailyChart";
import { AlertsFilterBar } from "@/components/security-alerts/AlertsFilterBar";
import { AlertsHeader } from "@/components/security-alerts/AlertsHeader";
import { AlertsTimelineCard } from "@/components/security-alerts/AlertsTimelineCard";
import { WebhookConfigDialog } from "@/components/security-alerts/WebhookConfigDialog";
import { AlertDetailsDialog } from "@/components/security-alerts/AlertDetailsDialog";
import { normalizeSeverity } from "@/components/security-alerts/VirtualTimeline";
import { useWebhookQueue } from "@/hooks/useWebhookQueue";
import { useWebhookHistory } from "@/hooks/useWebhookHistory";
import { useWebhookConfig } from "@/hooks/useWebhookConfig";
import { useAlertsExport } from "@/hooks/useAlertsExport";
import { useSecurityAlertNotifications } from "@/hooks/useSecurityAlertNotifications";
import { useAlertPresets } from "@/hooks/useAlertPresets";
import { useTestWebhook } from "@/hooks/useTestWebhook";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { AlertFilterPreset } from "@/lib/security-alerts-presets";

const ALL_SOURCES = "__all__";

function formatQueueAge(ms: number): string {
  if (ms <= 0) return "agora";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function SecurityAlerts() {
  usePageTitle("Alertas de Segurança");
  const [searchParams, setSearchParams] = useSearchParams();

  const sourceFilter = searchParams.get("source") ?? ALL_SOURCES;
  const searchTerm = searchParams.get("q") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === ALL_SOURCES) next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Debounced search — evita refetch a cada tecla.
  const [searchInput, setSearchInput] = useState(searchTerm);
  useEffect(() => setSearchInput(searchTerm), [searchTerm]);
  useEffect(() => {
    if (searchInput === searchTerm) return;
    const t = setTimeout(() => updateParam("q", searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput, searchTerm, updateParam]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    alerts,
    allData,
    grouped,
    days,
    chartData,
    availableSources,
    sentinelRef,
    markRead,
    markAllRead,
    markResolved,
  } = useSecurityAlertNotifications({ sourceFilter, searchTerm });

  const applyPresetToUrl = useCallback(
    (p: AlertFilterPreset) => {
      const next = new URLSearchParams();
      if (p.source && p.source !== ALL_SOURCES) next.set("source", p.source);
      if (p.q) next.set("q", p.q);
      setSearchParams(next, { replace: true });
      setSearchInput(p.q);
    },
    [setSearchParams],
  );

  const { presets, applyPreset, savePreset, removePreset } = useAlertPresets({
    sourceFilter,
    searchTerm,
    onApply: applyPresetToUrl,
  });

  // Webhook config + queue + history
  const webhookConfig = useWebhookConfig();
  const {
    url: webhookUrl,
    secret: webhookSecret,
    maxAttempts: webhookMaxAttempts,
    baseDelayMs: webhookBaseDelayMs,
    maxDelayMs: webhookMaxDelayMs,
    urlDraft: webhookDraft,
    setUrlDraft: setWebhookDraft,
    secretDraft: webhookSecretDraft,
    setSecretDraft: setWebhookSecretDraft,
    maxAttemptsDraft: webhookMaxAttemptsDraft,
    setMaxAttemptsDraft: setWebhookMaxAttemptsDraft,
    baseDelayDraft: webhookBaseDelayDraft,
    setBaseDelayDraft: setWebhookBaseDelayDraft,
    maxDelayDraft: webhookMaxDelayDraft,
    setMaxDelayDraft: setWebhookMaxDelayDraft,
    dialogOpen: webhookDialogOpen,
    setDialogOpen: setWebhookDialogOpen,
    openDialog: openWebhookDialog,
    save: handleSaveWebhook,
    validation: webhookValidation,
  } = webhookConfig;

  const {
    pendingCount: webhookPendingCount,
    oldestAgeMs: webhookOldestAgeMs,
    isFlushing: isFlushingQueue,
    flushedAt: webhookQueueFlushedAt,
    flush: handleFlushQueue,
    clear: handleClearQueue,
  } = useWebhookQueue();

  const {
    history: webhookHistory,
    record: recordWebhookHistory,
    clear: handleClearWebhookHistory,
    exportCsv: handleExportWebhookHistory,
    exportNdjson: handleExportWebhookHistoryNdjson,
  } = useWebhookHistory(webhookQueueFlushedAt);

  const { isTesting: isTestingWebhook, testWebhook: handleTestWebhook } = useTestWebhook({
    validation: webhookValidation,
    maxAttemptsDraft: webhookMaxAttemptsDraft,
    baseDelayDraft: webhookBaseDelayDraft,
    maxDelayDraft: webhookMaxDelayDraft,
    recordHistory: recordWebhookHistory,
  });

  const { isExporting, handleExport } = useAlertsExport({
    sinceIso: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    searchTerm,
    sourceFilter,
    webhookUrl,
    webhookSecret,
    webhookMaxAttempts,
    webhookBaseDelayMs,
    webhookMaxDelayMs,
    recordWebhookHistory,
  });

  const unreadCount = allData.filter((a) => !a.is_read).length;
  const criticalCount = allData.filter((a) => normalizeSeverity(a.severity) === "critical").length;
  const hasActiveFilters = sourceFilter !== ALL_SOURCES || searchTerm.length > 0;
  const filterKey = `${sourceFilter}::${searchTerm}`;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl">
      <AlertsHeader
        onRefresh={() => alerts.refetch()}
        onExport={handleExport}
        isExporting={isExporting}
        onOpenWebhookDialog={openWebhookDialog}
        webhookConfigured={!!webhookUrl}
        onMarkAllRead={() => markAllRead(allData.filter((a) => !a.is_read).map((a) => a.id))}
        unreadCount={unreadCount}
        hasActiveFilters={hasActiveFilters}
      />

      <KpiStrip
        total={allData.length}
        unread={unreadCount}
        critical={criticalCount}
        webhookPending={webhookPendingCount}
        webhookOldestLabel={formatQueueAge(webhookOldestAgeMs)}
      />

      <AlertsFilterBar
        sourceFilter={sourceFilter}
        allSourcesToken={ALL_SOURCES}
        availableSources={availableSources}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSourceChange={(v) => updateParam("source", v)}
        onClear={() => setSearchParams(new URLSearchParams(), { replace: true })}
        hasActiveFilters={hasActiveFilters}
        filteredCount={allData.length}
        totalCount={allData.length}
        presets={presets}
        onApplyPreset={applyPreset}
        onRemovePreset={removePreset}
        onSavePreset={savePreset}
      />

      <AlertsDailyChart data={chartData} />

      <AlertsTimelineCard
        isLoading={alerts.isLoading}
        days={days}
        grouped={grouped}
        onSelect={setSelectedId}
        onMarkRead={markRead}
        sentinelRef={sentinelRef}
        isFetchingNextPage={alerts.isFetchingNextPage}
        hasNextPage={!!alerts.hasNextPage}
        totalLoaded={allData.length}
        onLoadMore={() => void alerts.fetchNextPage()}
        resetKey={filterKey}
        nextPageError={alerts.isFetchNextPageError ? alerts.error : null}
      />

      <AlertDetailsDialog
        alert={allData.find((a) => a.id === selectedId) ?? null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onMarkRead={markRead}
        onMarkResolved={async (id) => {
          await markResolved(id);
          setSelectedId(null);
        }}
      />

      <WebhookConfigDialog
        open={webhookDialogOpen}
        onOpenChange={setWebhookDialogOpen}
        webhookUrl={webhookUrl}
        webhookSecret={webhookSecret}
        webhookDraft={webhookDraft}
        setWebhookDraft={setWebhookDraft}
        webhookSecretDraft={webhookSecretDraft}
        setWebhookSecretDraft={setWebhookSecretDraft}
        webhookMaxAttemptsDraft={webhookMaxAttemptsDraft}
        setWebhookMaxAttemptsDraft={setWebhookMaxAttemptsDraft}
        webhookBaseDelayDraft={webhookBaseDelayDraft}
        setWebhookBaseDelayDraft={setWebhookBaseDelayDraft}
        webhookMaxDelayDraft={webhookMaxDelayDraft}
        setWebhookMaxDelayDraft={setWebhookMaxDelayDraft}
        webhookValidation={webhookValidation}
        webhookHistory={webhookHistory}
        webhookPendingCount={webhookPendingCount}
        isTestingWebhook={isTestingWebhook}
        isFlushingQueue={isFlushingQueue}
        onSave={handleSaveWebhook}
        onTest={handleTestWebhook}
        onFlushQueue={handleFlushQueue}
        onClearQueue={handleClearQueue}
        onExportHistory={handleExportWebhookHistory}
        onExportHistoryNdjson={handleExportWebhookHistoryNdjson}
        onClearHistory={handleClearWebhookHistory}
      />
    </div>
  );
}
