
import { lazy } from 'react';

// Placeholder component since DataTable module doesn't exist as a standalone export
export const LazyDataTable = lazy(() =>
  Promise.resolve({
    default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  })
);
