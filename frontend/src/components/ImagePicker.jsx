import { useEffect, useRef, useState } from 'react';

const MAX = 3 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Lampiran gambar: unggah berkas ATAU tempel URL. value = { file, url }
export default function ImagePicker({ value, onChange, onError, label = 'Gambar' }) {
  const inputRef = useRef(null);
  const [urlMode, setUrlMode] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (value.file) {
      const u = URL.createObjectURL(value.file);
      setPreview(u);
      return () => URL.revokeObjectURL(u);
    }
    setPreview(value.url?.trim() || null);
  }, [value.file, value.url]);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) return onError?.('Format gambar harus JPG, PNG, GIF, atau WEBP');
    if (file.size > MAX) return onError?.('Ukuran gambar maksimal 3 MB');
    setUrlMode(false);
    onChange({ file, url: '' });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept={TYPES.join(',')} onChange={pick} className="hidden" aria-label={`Unggah ${label}`} />
        <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => inputRef.current.click()}>
          Unggah {label.toLowerCase()}
        </button>
        <button
          type="button"
          className="btn-ghost !px-3 !py-1.5"
          aria-pressed={urlMode}
          onClick={() => { setUrlMode((v) => !v); onChange({ file: null, url: '' }); }}
        >
          Pakai URL
        </button>
        {(value.file || value.url) && (
          <button type="button" className="btn-ghost !px-3 !py-1.5 text-heart" onClick={() => { onChange({ file: null, url: '' }); setUrlMode(false); }}>
            Batal
          </button>
        )}
      </div>
      {urlMode && (
        <input
          type="url"
          className="input"
          placeholder="https://contoh.com/gambar.jpg"
          value={value.url}
          onChange={(e) => onChange({ file: null, url: e.target.value })}
          aria-label={`URL ${label}`}
        />
      )}
      {preview && (
        <img
          src={preview}
          alt={`Pratinjau ${label.toLowerCase()}`}
          className="max-h-48 rounded-xl border border-line object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          onLoad={(e) => (e.currentTarget.style.display = '')}
        />
      )}
    </div>
  );
}
