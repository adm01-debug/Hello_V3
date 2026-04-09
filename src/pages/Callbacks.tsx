import { ScheduledCallbacksList } from '@/components/callbacks/ScheduledCallbacksList';
import { usePageTitle } from '@/hooks/usePageTitle';

const Callbacks = () => {
  usePageTitle('Callbacks');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Callbacks Agendados</h1>
        <p className="text-muted-foreground">Gerencie retornos de ligação para clientes</p>
      </div>

      <ScheduledCallbacksList />
    </div>
  );
};

export default Callbacks;
