import { Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});

const Analytics = lazy(() => import('@/components/Analytics'));
const Reports = lazy(() => import('@/components/Reports'));

function LoadingSkeleton() {
  return <div className="animate-pulse">Loading...</div>;
}

export default function App() {
  return (
    <div>
      <Dashboard />
      <Suspense fallback={<LoadingSkeleton />}>
        <Analytics />
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>
        <Reports />
      </Suspense>
    </div>
  );
}
