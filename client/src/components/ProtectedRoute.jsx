import { Navigate, Outlet } from 'react-router-dom';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Loader label="Checking session..." />
      </main>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
