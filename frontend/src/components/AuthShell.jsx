import { Logo } from './Navbar.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <Logo light />
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-extrabold leading-tight">Satu ruang untuk semua kabar tim.</h2>
          <p className="text-lg text-white/70">
            Bagikan status, balas dengan gambar, dan lihat siapa yang sedang membicarakan apa, tanpa harus mencari di grup chat.
          </p>
        </div>
        <p className="text-sm text-white/50">ConnectSpace, jejaring internal perusahaan</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mb-8 mt-2 text-ink-soft">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-ink-soft">{footer}</p>
        </div>
      </main>
    </div>
  );
}
