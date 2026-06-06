import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from './components/layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ManufacturerDashboard } from './pages/ManufacturerDashboard';
import { RetailerDashboard } from './pages/RetailerDashboard';
import { ConsumerVerification } from './pages/ConsumerVerification';
import { AdminPanel } from './pages/AdminPanel';
import { DistributorDashboard } from './pages/DistributorDashboard';
import { NotFound } from './pages/NotFound';
import { mockAuth } from './services/mockAuth';

// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}) => {
  const user = mockAuth.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { 
        path: 'manufacturer', 
        element: (
          <ProtectedRoute allowedRoles={['manufacturer', 'admin']}>
            <ManufacturerDashboard />
          </ProtectedRoute>
        )
      },
      { 
        path: 'retailer', 
        element: (
          <ProtectedRoute allowedRoles={['retailer', 'admin']}>
            <RetailerDashboard />
          </ProtectedRoute>
        )
      },
      { 
        path: 'verify', 
        Component: ConsumerVerification
      },
      { 
        path: 'distributor', 
        element: (
          <ProtectedRoute allowedRoles={['distributor', 'admin']}>
            <DistributorDashboard />
          </ProtectedRoute>
        )
      },
      { 
        path: 'admin', 
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        )
      },
      { path: '*', Component: NotFound }
    ]
  }
]);
