import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Seo, { SITE_URL } from '../components/Seo';
import { publicApi, type BlogPost } from '../lib/api';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setPost(null);
    setNotFound(false);
    publicApi.blogPost(slug).then(setPost).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="pt-40 pb-24 text-center px-4 min-h-screen">
        <h1 className="font-serif text-3xl font-semibold text-espresso mb-4">Post not found</h1>
        <Link to="/blog" className="text-gold font-bold underline">Back to the blog</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-36 pb-24 px-4 max-w-3xl mx-auto min-h-screen space-y-4" aria-busy="true">
        <div className="skeleton h-10 w-3/4 rounded-full" />
        <div className="skeleton h-64 w-full rounded-3xl" />
        <div className="skeleton h-40 w-full rounded-3xl" />
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image ? `${SITE_URL}${post.image}` : undefined,
    datePublished: post.created_at,
    author: { '@type': 'Organization', name: 'Quality Dates and Nuts' },
    publisher: { '@type': 'Organization', name: 'Quality Dates and Nuts', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
  };

  return (
    <article className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-screen">
      <Seo title={post.title} description={post.excerpt || post.content.slice(0, 155)} path={`/blog/${post.slug}`} image={post.image} jsonLd={jsonLd} />

      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-cocoa hover:text-espresso transition-colors mb-8">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> All posts
      </Link>

      <p className="text-xs text-cocoa-light mb-3">{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <h1 className="font-serif text-4xl md:text-5xl font-semibold text-espresso leading-tight mb-8">{post.title}</h1>

      {post.image && (
        <div className="rounded-[2rem] overflow-hidden bg-cream-dark mb-10 shadow-xl shadow-espresso/10">
          <img src={post.image} alt={post.title} className="w-full object-cover" />
        </div>
      )}

      <div className="space-y-5 text-cocoa leading-relaxed">
        {post.content.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) =>
          /^\d+\./.test(line)
            ? <h2 key={i} className="font-serif text-xl font-semibold text-espresso pt-2">{line}</h2>
            : <p key={i}>{line}</p>
        )}
      </div>

      <div className="mt-12 border-t border-espresso/10 pt-8 text-center">
        <Link to="/shop" className="inline-block bg-espresso text-cream px-9 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cocoa transition-colors">
          Shop the collection
        </Link>
      </div>
    </article>
  );
}
