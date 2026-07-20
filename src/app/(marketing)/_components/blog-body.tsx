import type { BlogBlock } from "../_lib/blog-posts";

export function BlogBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-16">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={idx}
                className="font-headline text-2xl sm:text-3xl italic text-slate-900 mt-12 mb-4"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={idx}
                className="font-body font-semibold text-lg text-slate-900 mt-8 mb-3"
              >
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p
                key={idx}
                className="font-body text-base text-slate-700 leading-relaxed mb-5"
              >
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul key={idx} className="space-y-2 mb-5 list-disc pl-5">
                {block.items.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="font-body text-base text-slate-700 leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-slate-300 pl-5 my-8 italic text-slate-800 font-body text-lg leading-relaxed"
              >
                {block.text}
                {block.cite && (
                  <footer className="mt-2 text-sm not-italic text-slate-500">
                    — {block.cite}
                  </footer>
                )}
              </blockquote>
            );
        }
      })}
    </div>
  );
}
