import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { HomeIcon, LogoutIcon } from './Icons.jsx';

export function Logo({ light = false }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="9" cy="14" r="7" fill="none" stroke={light ? '#fff' : '#3d3df5'} strokeWidth="3" />
        <circle cx="19" cy="14" r="7" fill="none" stroke={light ? '#a9a9ff' : '#0e1a2b'} strokeWidth="3" />
      </svg>
      ConnectSpace
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const doLogout = async () => {
    setLoading(true);
    await logout(); // setelah ini user = null dan halaman otomatis ke Login
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" aria-label="Beranda"><Logo /></Link>
            <NavLink
              to="/"
              end
              aria-label="Beranda"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-mist hover:text-ink'
                }`
              }
            >
              <HomeIcon />
              <span className="hidden sm:inline">Home</span>
            </NavLink>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink
              to={`/u/${user.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 text-sm font-semibold hover:bg-mist ${isActive ? 'bg-mist' : ''}`
              }
            >
              <Avatar user={user} size={32} />
              <span className="hidden max-w-[10rem] truncate sm:block">{user.name}</span>
            </NavLink>
            <button onClick={() => setConfirming(true)} className="btn-logout ml-1" aria-label="Keluar">
              <LogoutIcon />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </nav>
        </div>
      </header>

      {confirming && (
        <ConfirmDialog
          title="Keluar dari ConnectSpace?"
          message="Anda akan keluar dan perlu login lagi untuk masuk."
          confirmText="Ya, keluar"
          danger={false}
          loading={loading}
          onCancel={() => setConfirming(false)}
          onConfirm={doLogout}
        />
      )}
    </>
  );
}