import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Globe } from 'lucide-react';
import { StatusCheckCard } from './calling-hours/StatusCheckCard';
import { RegionsTable } from './calling-hours/RegionsTable';
import { RegionFormDialog } from './calling-hours/RegionFormDialog';
import { useCallingHoursManager } from './calling-hours/useCallingHoursManager';
import {
  draftFromRegion,
  emptyDraft,
  type CallingHoursDraft,
  type CallingHoursRegion,
} from './calling-hours/types';

type DialogState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; region: CallingHoursRegion };

export function CallingHoursConfig() {
  const {
    regions,
    isLoading,
    saving,
    stats,
    createRegion,
    updateRegion,
    deleteRegion,
    toggleActive,
    checkNow,
  } = useCallingHoursManager();

  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const openCreate = () => setDialog({ open: true, mode: 'create' });
  const openEdit = (region: CallingHoursRegion) =>
    setDialog({ open: true, mode: 'edit', region });
  const closeDialog = () => setDialog({ open: false });

  const initialDraft: CallingHoursDraft | undefined =
    dialog.open && dialog.mode === 'edit' ? draftFromRegion(dialog.region) : emptyDraft();

  const handleSubmit = async (draft: CallingHoursDraft) => {
    if (!dialog.open) return;
    const ok =
      dialog.mode === 'create'
        ? await createRegion(draft)
        : await updateRegion(dialog.region.id, draft);
    if (ok) closeDialog();
  };

  return (
    <div className="space-y-6">
      <StatusCheckCard regions={regions} onCheck={checkNow} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regiões configuradas
              </CardTitle>
              <CardDescription>
                {stats.total} regiões · {stats.active} ativas · {stats.inactive} inativas
              </CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova região
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RegionsTable
            regions={regions}
            isLoading={isLoading}
            onEdit={openEdit}
            onDelete={deleteRegion}
            onToggleActive={toggleActive}
          />
        </CardContent>
      </Card>

      <RegionFormDialog
        open={dialog.open}
        mode={dialog.open ? dialog.mode : 'create'}
        initial={initialDraft}
        saving={saving}
        onOpenChange={(o) => (o ? null : closeDialog())}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
