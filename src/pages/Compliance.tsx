import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DNCListManager } from '@/components/compliance/DNCListManager';
import { CallingHoursConfig } from '@/components/compliance/CallingHoursConfig';
import { ComplianceSettings } from '@/components/compliance/ComplianceSettings';
import { 
  Ban, 
  Clock, 
  Settings, 
  Shield,
  FileText
} from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Compliance & DNC</h1>
          <p className="text-muted-foreground">
            Gerencie conformidade, lista DNC e horários de discagem
          </p>
        </div>
      </div>

      <Tabs defaultValue="dnc" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dnc" className="gap-2">
            <Ban className="h-4 w-4" />
            <span className="hidden sm:inline">Lista DNC</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dnc">
          <DNCListManager />
        </TabsContent>

        <TabsContent value="hours">
          <CallingHoursConfig />
        </TabsContent>

        <TabsContent value="settings">
          <ComplianceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
