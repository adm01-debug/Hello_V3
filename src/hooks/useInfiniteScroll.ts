import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';

interface InfiniteScrollPage {
  items: any[];
  hasMore: boolean;
}

export function useInfiniteScroll(
  queryKey: string[], 
  fetchFn: (pageParam: number) => Promise<InfiniteScrollPage>
): UseInfiniteQueryResult<{ pages: InfiniteScrollPage[] }, Error> {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => fetchFn(pageParam as number),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? undefined : undefined;
    },
    initialPageParam: 0,
  });
}
