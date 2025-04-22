import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";

const MarkdownViewer = ({ content }) => (
  <div className="prose max-w-none">
    <ReactMarkdown
      children={content}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-bold mt-4 mb-2" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-lg font-bold mt-3 mb-2" {...props} />
        ),

        // Style block quotes
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700"
            {...props}
          />
        ),

        // Style lists
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-5 mb-4" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-5 mb-4" {...props} />
        ),

        // Style code blocks
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code className="font-mono bg-gray-100 px-1 rounded" {...props} />
          ) : (
            <code
              className="block bg-gray-100 p-3 rounded font-mono text-sm overflow-auto"
              {...props}
            />
          ),

        // Style emphasis and strong
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        strong: ({ node, ...props }) => (
          <strong className="font-bold" {...props} />
        ),

        // Add custom wrapper for math display formulas
        pre: ({ node, ...props }) => {
          // Check if the pre contains a math formula (KaTeX adds special classes)
          const isDisplayMath =
            props.children &&
            typeof props.children === "object" &&
            props.children.props &&
            props.children.props.className &&
            props.children.props.className.includes("math");

          return isDisplayMath ? (
            <div className="flex justify-center my-4">
              <pre {...props} />
            </div>
          ) : (
            <pre
              className="bg-gray-100 p-3 rounded overflow-auto my-4"
              {...props}
            />
          );
        },
      }}
    />
  </div>
);

export default MarkdownViewer;
