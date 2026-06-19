import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuditPage } from './pages/AuditPage';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ItemsPage } from './pages/ItemsPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { SchedulingPage } from './pages/SchedulingPage';
import { TransportTypesPage } from './pages/TransportTypesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/new', element: <NewOrderPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'scheduling', element: <SchedulingPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'transport-types', element: <TransportTypesPage /> },
      { path: 'items', element: <ItemsPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'monitoring', element: <Navigate to="/orders" replace /> },
    ],
  },
]);
