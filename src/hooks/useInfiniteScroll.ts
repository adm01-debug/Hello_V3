import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteScroll(queryKey: string[], fetchFn: any) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => fetchFn(pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
  });
}

export function InfiniteScrollList({ queryKey, fetchFn, renderItem }: any) {
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteScroll(queryKey, fetchFn);
  const observerRef = React.useRef<IntersectionObserver>();
  const loadMoreRef = React.useCallback(
    (node: HTMLDivElement) => {
      if (isFetching) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetching, hasNextPage, fetchNextPage]
  );

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.items.map(renderItem)}
        </React.Fragment>
      ))}
      <div ref={loadMoreRef}>{isFetching && 'Loading...'}</div>
    </div>
  );
}
