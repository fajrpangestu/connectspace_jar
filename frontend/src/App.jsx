import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Feed from './pages/Feed.jsx';
import Profile from './pages/Profile.jsx';
import UserProfile from './pages/UserProfile.jsx';

function Splash() {
  return <div className="grid min-h-screen place-items-center text-ink-soft">Memuat…</div>;
}

// Auth guard: belum login -> kembali ke Login dengan notifikasi peringatan
function ProtectedRoute() {
  const { user, loading, loggedOut } = useAuth();
  const { notify } = useToast();

  useEffect(() => {
    if (!loading && !user && !loggedOut) {
      notify('Anda harus login terlebih dahulu untuk mengakses halaman tersebut.', 'warning');
    }
  }, [loading, user, loggedOut, notify]);

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// Sudah login -> tidak boleh membuka Login/Register lagi
function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/u/:id" element={<UserProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
