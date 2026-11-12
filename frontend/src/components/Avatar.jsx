import { useState } from 'react';

const TONES = ['bg-indigo-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600', 'bg-sky-600', 'bg-fuchsia-600'];

export default function Avatar({ user, size = 40 }) {
  const [broken, setBroken] = useState(false);
  const name = user?.name || '?';
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (user?.avatar && !broken) {
    return (
      <img
        src={user.avatar}
        alt={`Foto profil ${name}`}
        style={style}
        className="shrink-0 rounded-full border border-line bg-mist object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  const tone = TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${tone}`} aria-label={name}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
