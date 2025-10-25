import { AuthProvider } from '../lib/authProvider';
import { ThemeProvider } from '../lib/themeProvider';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProtectedRoute>
          <Dashboard initialTab="analyzer" />
        </ProtectedRoute>
      </ThemeProvider>
    </AuthProvider>
  );
}
