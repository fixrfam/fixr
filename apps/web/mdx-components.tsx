import type { MDXComponents } from "mdx/types"

const components = {
  h1: ({ children }) => (
    <h1 style={{ fontSize: "3rem" }} className="font-semibold tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h1 style={{ fontSize: "2rem" }} className="font-semibold tracking-tight">
      {children}
    </h1>
  ),
  h3: ({ children }) => (
    <h1
      style={{ fontSize: "1.75rem" }}
      className="font-semibold tracking-tight"
    >
      {children}
    </h1>
  ),
  p: ({ children }) => (
    <>
      <p>{children}</p>
    </>
  ),
  a: (props) => (
    <a style={{ color: "var(--primary)" }} {...props}>
      {props.children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc" style={{ marginLeft: "25px" }}>
      {children}
    </ul>
  ),
  li: ({ children }) => <li className="my-1">{children}</li>,
  hr: () => <hr className="my-4" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-border pl-6">
      {children}
    </blockquote>
  ),
} satisfies MDXComponents

export function useMDXComponents(): MDXComponents {
  return components
}
