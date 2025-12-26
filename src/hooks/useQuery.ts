import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCalls(userId: string) {
  return useQuery({
    queryKey: ['calls', userId],
    queryFn: () => fetchCalls(userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}

async function fetchCalls(userId: string) {
  const res = await fetch(`/api/calls?userId=${userId}`);
  return res.json();
}

async function createCall(data: any) {
  const res = await fetch('/api/calls', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}
