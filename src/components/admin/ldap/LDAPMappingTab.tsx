import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { LDAPConfig } from './types';

interface Props {
  config: LDAPConfig;
  setConfig: React.Dispatch<React.SetStateAction<LDAPConfig>>;
}

const FIELDS: Array<{ label: string; key: keyof LDAPConfig['fieldMapping']; placeholder: string }> = [
  { label: 'Nome', key: 'name', placeholder: 'cn' },
  { label: 'Email', key: 'email', placeholder: 'mail' },
  { label: 'Telefone', key: 'phone', placeholder: 'telephoneNumber' },
  { label: 'Empresa', key: 'company', placeholder: 'company' },
  { label: 'Cargo', key: 'position', placeholder: 'title' },
];

export function LDAPMappingTab({ config, setConfig }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mapeamento de Campos</CardTitle>
        <CardDescription>Mapeie atributos LDAP para campos de contatos do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-4 rounded-lg border border-border p-3">
              <div className="w-24 text-sm font-medium">{field.label}</div>
              <span className="text-muted-foreground">→</span>
              <Input
                placeholder={field.placeholder}
                value={config.fieldMapping[field.key]}
                onChange={(e) =>
                  setConfig(p => ({
                    ...p,
                    fieldMapping: { ...p.fieldMapping, [field.key]: e.target.value },
                  }))
                }
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
