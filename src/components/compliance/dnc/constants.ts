export const DNC_REASONS = [
  { value: 'manual', label: 'Adição Manual' },
  { value: 'customer_request', label: 'Solicitação do Cliente' },
  { value: 'complaint', label: 'Reclamação' },
  { value: 'legal', label: 'Determinação Legal' },
  { value: 'opt_out', label: 'Opt-out' },
  { value: 'wrong_number', label: 'Número Incorreto' },
  { value: 'deceased', label: 'Titular Falecido' },
] as const;

export function getReasonLabel(reason: string) {
  return DNC_REASONS.find(r => r.value === reason)?.label || reason;
}

export function getReasonVariant(reason: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (reason) {
    case 'complaint':
    case 'legal':
      return 'destructive';
    case 'customer_request':
    case 'opt_out':
      return 'secondary';
    default:
      return 'outline';
  }
}
