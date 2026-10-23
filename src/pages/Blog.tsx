import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import { publicApi, type BlogPost } from '../lib/api';

export default function Blog() {
  const [posts, setPosts] = useState<Omit<BlogPost, 'content' | 'published'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.blog().then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen">
      <Seo
        title="Blog — Recipes, Guides & Stories"
        description="Recipes, health guides and stories from Quality Dates and Nuts — how to enjoy dates, nuts and dry fruits every day."
        path="/blog"
      />
      <div className="text-center mb-14">
        <BookOpen className="w-9 h-9 text-gold mx-auto mb-4" aria-hidden="true" />
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-espresso">From our kitchen journal</h1>
        <p className="text-cocoa-light mt-3">Recipes, storage guides and the stories behind our sourcing.</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[0, 1].map((i) => <div key={i} className="skeleton h-72 rounded-3xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-cocoa-light">No posts yet — check back soon.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.06}>
              <Link to={`/blog/${post.slug}`} className="group block bg-white rounded-3xl border border-espresso/5 overflow-hidden hover:shadow-xl hover:shadow-gold/10 transition-all hover:-translate-y-1 h-full">
                {post.image && (
                  <div className="aspect-[16/9] overflow-hidden bg-cream-dark">
                    <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
                <div className="p-7">
                  <p className="text-xs text-cocoa-light mb-2">{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <h2 className="font-serif text-xl font-semibold text-espresso group-hover:text-cocoa transition-colors leading-snug">{post.title}</h2>
                  <p className="text-sm text-cocoa-light mt-3 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-block mt-4 text-xs font-bold tracking-widest uppercase text-gold">Read more →</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
