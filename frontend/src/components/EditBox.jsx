import { useState } from 'react';
import ImagePicker from './ImagePicker.jsx';
import { toFormData } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

// Form edit teks + gambar, dipakai untuk postingan dan komentar.
// onSave(formData) harus melempar error jika gagal.
export default function EditBox({ initialText, currentImage, textField, multiline = true, onSave, onCancel }) {
  const { notify } = useToast();
  const [text, setText] = useState(initialText || '');
  const [img, setImg] = useState({ file: null, url: '' });
  const [removeImg, setRemoveImg] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const willHaveImage = img.file || img.url.trim() || (currentImage && !removeImg);
    if (!text.trim() && !willHaveImage) return notify('Isi teks atau lampirkan gambar.', 'warning');
    setSaving(true);
    try {
      await onSave(
        toFormData({
          [textField]: text,
          image: img.file,
          image_url: img.url,
          remove_image: removeImg ? 'true' : '',
        })
      );
    } catch (err) {
      notify(err.message, 'error');
      setSaving(false);
    }
  };

  const Field = multiline ? 'textarea' : 'input';
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field
        className={`input ${multiline ? 'min-h-[88px] resize-y' : ''}`}
        value={text}
        maxLength={multiline ? 5000 : 1000}
        onChange={(e) => setText(e.target.value)}
        aria-label="Edit teks"
        autoFocus
      />
      {currentImage && !img.file && !img.url && (
        <div className="space-y-2">
          {!removeImg && <img src={currentImage} alt="Gambar saat ini" className="max-h-40 rounded-xl border border-line" />}
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={removeImg} onChange={(e) => setRemoveImg(e.target.checked)} /> Hapus gambar ini
          </label>
        </div>
      )}
      <ImagePicker value={img} onChange={(v) => { setImg(v); setRemoveImg(false); }} onError={(m) => notify(m, 'error')} label={currentImage ? 'Gambar baru' : 'Gambar'} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={saving}>Batal</button>
        <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </form>
  );
}