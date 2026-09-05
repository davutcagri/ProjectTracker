import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/*
  Bir .md dosyasının render edilmiş hâli. Tailwind'in typography eklentisi
  kapsamda değil (kapsam dışı bağımlılık), bu yüzden her eleman tipine elle
  sınıf veriyoruz — token'lar diğer bileşenlerle aynı (fg/fg-muted/accent).
  `remark-gfm`: ROADMAP.md'deki `- [x]` / `- [ ]` onay kutularının ham metin
  yerine gerçek checkbox olarak görünmesi için (GitHub Flavored Markdown).
*/

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="text-[13.5px] leading-relaxed text-fg-muted">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-5 text-[18px] font-semibold text-fg first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 text-[15px] font-semibold text-fg first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 text-[13.5px] font-semibold text-fg first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-accent/30 underline-offset-2 hover:text-accent-hover"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-fg-subtle">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-fg-subtle">
              {children}
            </ol>
          ),
          li: ({ children, className }) => (
            <li className={className?.includes('task-list-item') ? 'ml-[-1.15rem] list-none' : ''}>
              {children}
            </li>
          ),
          input: ({ checked }) => (
            <input
              type="checkbox"
              checked={!!checked}
              disabled
              className="mr-1.5 accent-accent"
            />
          ),
          code: ({ children, className }) =>
            className ? (
              <code className={`${className} font-mono text-[12.5px]`}>{children}</code>
            ) : (
              <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[12.5px] text-fg">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-sunken p-3 text-[12.5px]">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-2 border-l-2 border-border pl-3 text-fg-subtle">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          table: ({ children }) => (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-2 py-1.5 font-medium text-fg">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-2 py-1.5 align-top">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
