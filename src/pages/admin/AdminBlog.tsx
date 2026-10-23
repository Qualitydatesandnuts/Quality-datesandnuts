import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, ImagePlus, Eye, EyeOff } from 'lucide-react';
import { adminApi, type BlogPost } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, inputCls, btnPrimary, btnGhost, fmtDate } from './ui';

interface FormState { title: string; excerpt: string; content: string; image: string; published: boolean }
const emptyForm: FormState = { title: '', excerpt: '', content: '', image: '', published: true };

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<BlogPost | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = () => adminApi.blogPosts().then(setPosts).catch(() => {});
  useEffect(() => { load(); }, []);

  const open = (p: BlogPost | 'new') => {
    setEditing(p);
    setForm(p === 'new' ? emptyForm : { title: p.title, excerpt: p.excerpt, content: p.content, image: p.image, published: !!p.published });
  };

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try {
      const { path } = await adminApi.upload(file.name, dataUrl);
      setForm((f) => ({ ...f, image: path }));
      toast('Cover image uploaded');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing === 'new') await adminApi.createBlogPost(form);
      else if (editing) await adminApi.updateBlogPost(editing.id, form);
      toast(editing === 'new' ? 'Post published' : 'Post updated');
      setEditing(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Blog"
        subtitle="Posts boost SEO and give AI answer engines fresh content to cite"
        action={<button onClick={() => open('new')} className={`${btnPrimary} flex items-center gap-2`}><Plus className="w-4 h-4" aria-hidden="true" /> New post</button>}
      />

      <div className="space-y-3">
        {posts.length === 0 && <Card><p className="text-sm text-cocoa-light">No posts yet — write your first one.</p></Card>}
        {posts.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {p.image && <img src={p.image} alt="" className="w-16 h-12 rounded-xl object-cover bg-cream-dark flex-shrink-0" />}
              <div className="min-w-0">
                <p className="font-semibold text-espresso truncate">{p.title}</p>
                <p className="text-xs text-cocoa-light mt-0.5">
                  {fmtDate(p.created_at)} · {p.published ? <span className="text-green-700 font-semibold">Published</span> : <span className="text-cocoa-light">Draft</span>}
                  {p.published ? <Link to={`/blog/${p.slug}`} className="text-gold font-bold ml-2">View →</Link> : null}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => adminApi.updateBlogPost(p.id, { published: !p.published }).then(() => { toast(p.published ? 'Moved to drafts' : 'Published'); load(); })}
                aria-label={p.published ? 'Unpublish' : 'Publish'}
                className="p-2.5 text-cocoa hover:text-espresso"
                title={p.published ? 'Unpublish' : 'Publish'}
              >
                {p.published ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
              <button onClick={() => open(p)} aria-label={`Edit ${p.title}`} className="p-2.5 text-cocoa hover:text-espresso"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
              <button
                onClick={() => window.confirm(`Delete "${p.title}"?`) && adminApi.deleteBlogPost(p.id).then(() => { toast('Post deleted'); load(); })}
                aria-label={`Delete ${p.title}`}
                className="p-2.5 text-cocoa hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] bg-espresso/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Blog editor">
          <form onSubmit={save} className="bg-white rounded-[2rem] w-full max-w-2xl p-8 space-y-4 my-auto">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-2xl font-semibold text-espresso">{editing === 'new' ? 'New post' : 'Edit post'}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="p-2 rounded-full hover:bg-cream"><X className="w-5 h-5" aria-hidden="true" /></button>
            </div>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Post title *" aria-label="Title" className={inputCls} />
            <input value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="Excerpt (shown in lists + meta description)" aria-label="Excerpt" className={inputCls} />
            <textarea required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder={'Write your post…\n\nStart a line with "1." to make it a section heading.'} aria-label="Content" rows={12} className={`${inputCls} resize-y`} />

            <div className="flex items-center gap-4">
              <button type="button" onClick={() => fileRef.current?.click()} className={`${btnGhost} flex items-center gap-2`}>
                <ImagePlus className="w-4 h-4" aria-hidden="true" /> {form.image ? 'Change cover' : 'Add cover image'}
              </button>
              {form.image && <img src={form.image} alt="Cover preview" className="h-12 rounded-lg object-cover" />}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files)} />
              <label className="flex items-center gap-2 text-sm text-cocoa cursor-pointer ml-auto">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="w-4 h-4 accent-[#A87614]" />
                Published
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
              <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving…' : 'Save post'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
