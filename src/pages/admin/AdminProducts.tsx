import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, ImagePlus, Star } from 'lucide-react';
import { api, adminApi, inr, type Product } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, inputCls, btnPrimary, btnGhost } from './ui';

const CATEGORIES = ['Dates', 'Stuffed Dates', 'Nuts', 'Dry Fruits', 'Seeds', 'Snacks', 'Gifting'];

interface VariantRow { label: string; price: string; mrp: string }

interface FormState {
  name: string; category: string; price: string; mrp: string; weight: string;
  badge: string; stock: string; featured: boolean; description: string; benefits: string;
  image: string; images: string[]; variants: VariantRow[];
}

const emptyForm: FormState = {
  name: '', category: 'Dates', price: '', mrp: '', weight: '', badge: '',
  stock: '50', featured: false, description: '', benefits: '', image: '', images: [], variants: [],
};

function toForm(p: Product): FormState {
  return {
    name: p.name, category: p.category, price: String(p.price), mrp: String(p.mrp),
    weight: p.weight, badge: p.badge, stock: String(p.stock), featured: p.featured,
    description: p.description, benefits: p.benefits.join('\n'), image: p.image, images: p.images,
    variants: p.variants.map((v) => ({ label: v.label, price: String(v.price), mrp: String(v.mrp) })),
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = () => api.products().then(setProducts).catch(() => {});
  useEffect(() => { load(); }, []);

  const open = (p: Product | 'new') => {
    setEditing(p);
    setForm(p === 'new' ? emptyForm : toForm(p));
  };

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const { path } = await adminApi.upload(file.name, dataUrl);
        setForm((f) => ({ ...f, image: f.image || path, images: [...f.images, path] }));
      }
      toast('Image uploaded');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) return toast('Add at least one image', 'error');
    setBusy(true);
    const body = {
      ...form,
      price: Number(form.price), mrp: Number(form.mrp || form.price), stock: Number(form.stock),
      benefits: form.benefits.split('\n').map((b) => b.trim()).filter(Boolean),
      variants: form.variants
        .filter((v) => v.label.trim() && Number(v.price) > 0)
        .map((v) => ({ label: v.label.trim(), price: Number(v.price), mrp: Number(v.mrp || v.price) })),
    };
    try {
      if (editing === 'new') await adminApi.createProduct(body);
      else if (editing) await adminApi.updateProduct(editing.id, body);
      toast(editing === 'new' ? 'Product added' : 'Product updated');
      setEditing(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name} ${p.weight}" permanently? Its reviews are deleted too.`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      toast('Product deleted');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <>
      <PageTitle
        title="Products"
        subtitle={`${products.length} products in catalog`}
        action={<button onClick={() => open('new')} className={`${btnPrimary} flex items-center gap-2`}><Plus className="w-4 h-4" aria-hidden="true" /> Add product</button>}
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-cocoa-light border-b border-espresso/10">
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Rating</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-espresso/5">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-cream/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="w-11 h-12 rounded-xl object-cover bg-cream-dark" />
                    <div>
                      <p className="font-semibold text-espresso">{p.name}</p>
                      <p className="text-xs text-cocoa-light">{p.weight}{p.badge && ` · ${p.badge}`}{p.featured && ' · Featured'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-cocoa">{p.category}</td>
                <td className="px-5 py-3 font-semibold text-espresso">{inr(p.price)} <span className="text-cocoa-light line-through text-xs">{inr(p.mrp)}</span></td>
                <td className="px-5 py-3">
                  <span className={`font-bold ${p.stock <= 10 ? 'text-red-600' : 'text-cocoa'}`}>{p.stock}</span>
                </td>
                <td className="px-5 py-3 text-cocoa"><span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-gold text-gold" aria-hidden="true" />{p.rating} ({p.reviewCount})</span></td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => open(p)} aria-label={`Edit ${p.name}`} className="p-2 text-cocoa hover:text-espresso"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                  <button onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="p-2 text-cocoa hover:text-red-600"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* editor modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] bg-espresso/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Product editor">
          <form onSubmit={save} className="bg-white rounded-[2rem] w-full max-w-2xl p-8 space-y-4 my-auto">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-2xl font-semibold text-espresso">{editing === 'new' ? 'Add product' : `Edit: ${editing.name}`}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="p-2 rounded-full hover:bg-cream"><X className="w-5 h-5" aria-hidden="true" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <input required value={form.name} onChange={set('name')} placeholder="Product name *" aria-label="Product name" className={`${inputCls} sm:col-span-2`} />
              <select value={form.category} onChange={set('category')} aria-label="Category" className={inputCls}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={form.weight} onChange={set('weight')} placeholder="Weight (e.g. 400g)" aria-label="Weight" className={inputCls} />
              <input required type="number" min="1" value={form.price} onChange={set('price')} placeholder="Selling price ₹ *" aria-label="Selling price" className={inputCls} />
              <input type="number" min="1" value={form.mrp} onChange={set('mrp')} placeholder="MRP ₹ (strike-through)" aria-label="MRP" className={inputCls} />
              <input type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="Stock" aria-label="Stock" className={inputCls} />
              <input value={form.badge} onChange={set('badge')} placeholder="Badge (e.g. Bestseller)" aria-label="Badge" className={inputCls} />
            </div>

            <textarea value={form.description} onChange={set('description')} placeholder="Description" aria-label="Description" rows={3} className={`${inputCls} resize-none`} />
            <textarea value={form.benefits} onChange={set('benefits')} placeholder={'Benefits — one per line\ne.g. No added sugar'} aria-label="Benefits" rows={3} className={`${inputCls} resize-none`} />

            <label className="flex items-center gap-2.5 text-sm text-cocoa cursor-pointer w-fit">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-[#A87614]" />
              Show in homepage “The Collection”
            </label>

            {/* pack-size variants */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cocoa-light mb-2">Pack sizes (optional)</p>
              {form.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 mb-2">
                  <input value={v.label} onChange={(e) => setForm((f) => ({ ...f, variants: f.variants.map((x, j) => j === i ? { ...x, label: e.target.value } : x) }))} placeholder="Label (e.g. 200g)" aria-label="Variant label" className={inputCls} />
                  <input type="number" min="1" value={v.price} onChange={(e) => setForm((f) => ({ ...f, variants: f.variants.map((x, j) => j === i ? { ...x, price: e.target.value } : x) }))} placeholder="Price ₹" aria-label="Variant price" className={inputCls} />
                  <input type="number" min="1" value={v.mrp} onChange={(e) => setForm((f) => ({ ...f, variants: f.variants.map((x, j) => j === i ? { ...x, mrp: e.target.value } : x) }))} placeholder="MRP ₹" aria-label="Variant MRP" className={inputCls} />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }))} aria-label="Remove variant" className="p-2 text-cocoa hover:text-red-600"><X className="w-4 h-4" aria-hidden="true" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setForm((f) => ({ ...f, variants: [...f.variants, { label: '', price: '', mrp: '' }] }))} className="text-xs font-bold text-gold">
                + Add pack size
              </button>
              <p className="text-[11px] text-cocoa-light mt-1.5">With pack sizes, shoppers pick 200g / 400g / 1kg on the product page and each has its own price.</p>
            </div>

            {/* images */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cocoa-light mb-2">Images</p>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img) => (
                  <div key={img} className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 ${form.image === img ? 'border-gold' : 'border-transparent'}`}>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, image: img }))} className="w-full h-full" aria-label="Set as main image">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => {
                        const images = f.images.filter((i) => i !== img);
                        return { ...f, images, image: f.image === img ? (images[0] || '') : f.image };
                      })}
                      aria-label="Remove image"
                      className="absolute top-1 right-1 p-1 bg-espresso/80 text-cream rounded-full"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-24 rounded-xl border-2 border-dashed border-espresso/20 flex flex-col items-center justify-center gap-1 text-cocoa-light hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
                  aria-label="Upload image"
                >
                  <ImagePlus className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[10px] font-bold">{uploading ? '…' : 'Upload'}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => uploadImages(e.target.files)} />
              </div>
              <p className="text-[11px] text-cocoa-light mt-2">Click a thumbnail to make it the main image. PNG / JPG / WebP up to 8MB.</p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setEditing(null)} className={btnGhost}>Cancel</button>
              <button type="submit" disabled={busy || uploading} className={btnPrimary}>{busy ? 'Saving…' : 'Save product'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
