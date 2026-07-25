import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingNav } from "../../_components/marketing-nav";
import { MarketingFooter } from "../../_components/marketing-footer";
import { BlogBody } from "../../_components/blog-body";
import { ArticleJsonLd } from "../../_components/json-ld";
import { blogPosts, getBlogPost } from "../../_lib/blog-posts";
import { BRAND_COLOR } from "../../_lib/brand";

const BASE_URL = "https://app.neuronic-automation.ai";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `${BASE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "de_DE",
      url,
      title: post.title,
      description: post.metaDescription,
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.metaDescription,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <ArticleJsonLd post={post} />
      <MarketingNav lang={lang} />
      <main>
        <article>
          <header className="mx-auto max-w-2xl px-6 pt-16 pb-8">
            <Link
              href="/blog"
              className="font-label text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
            >
              ← Blog
            </Link>
            <p
              className="font-label text-xs font-bold uppercase tracking-widest mt-6 mb-4"
              style={{ color: BRAND_COLOR }}
            >
              {post.heroEyebrow}
            </p>
            <h1 className="font-headline text-3xl sm:text-4xl italic leading-[1.1] text-slate-900 mb-4">
              {post.title}
            </h1>
            <time
              dateTime={post.publishedAt}
              className="font-body text-sm text-slate-500"
            >
              {new Date(post.publishedAt).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </header>

          <BlogBody blocks={post.body} />

          <div className="mx-auto max-w-2xl px-6 pb-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="font-headline text-2xl italic text-slate-900 mb-3">
                {post.ctaHeadline}
              </h2>
              <p className="font-body text-sm text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
                {post.ctaSub}
              </p>
              <Link
                href={post.ctaHref}
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-medium text-white transition shadow-sm"
                style={{ backgroundColor: post.accentColor }}
              >
                {post.ctaLabel}
              </Link>
            </div>
          </div>
        </article>
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
