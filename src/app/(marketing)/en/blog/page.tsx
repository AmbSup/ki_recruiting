import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../../_components/marketing-nav";
import { MarketingFooter } from "../../_components/marketing-footer";
import { blogPosts } from "../../_lib/blog-posts";
import { BRAND_COLOR } from "../../_lib/brand";

export const metadata: Metadata = {
  title: "Blog: AI for Recruiting, Sales, and SMBs",
  description:
    "Practical articles on AI voice agents, speed-to-lead, time-to-hire, and AI knowledge management — for recruiting, sales, and SMBs in Austria and the DACH region.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en/blog",
    languages: {
      de: "https://app.neuronic-automation.ai/blog",
      en: "https://app.neuronic-automation.ai/en/blog",
      "x-default": "https://app.neuronic-automation.ai/blog",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.neuronic-automation.ai/en/blog",
    title: "Blog: AI for Recruiting, Sales, and SMBs",
    description:
      "Practical articles on AI voice agents, speed-to-lead, time-to-hire, and AI knowledge management — for recruiting, sales, and SMBs in Austria and the DACH region.",
  },
  twitter: {
    card: "summary",
    title: "Blog: AI for Recruiting, Sales, and SMBs",
    description:
      "Practical articles on AI voice agents, speed-to-lead, time-to-hire, and AI knowledge management — for recruiting, sales, and SMBs in Austria and the DACH region.",
  },
};

export default function EnBlogIndexPage() {
  const lang = "en" as const;
  const posts = [...blogPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang={lang} />
      <main>
        <section className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
          <p
            className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-4"
            style={{ color: BRAND_COLOR }}
          >
            Blog
          </p>
          <h1 className="font-headline text-4xl sm:text-5xl italic leading-[1.05] text-slate-900 mb-6">
            AI for Recruiting, Sales, and SMBs
          </h1>
          <p className="font-body text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Practical articles on speed-to-lead, time-to-hire, AI knowledge management, and AI
            automation for SMBs — no buzzword fog.
          </p>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-24">
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/en/blog/${post.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-sm transition"
              >
                <time
                  dateTime={post.publishedAt}
                  className="font-label text-xs font-bold uppercase tracking-widest text-slate-400"
                >
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2 className="font-headline text-2xl italic text-slate-900 mt-2 mb-3">
                  {post.en.title}
                </h2>
                <p className="font-body text-sm text-slate-600 leading-relaxed">
                  {post.en.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
