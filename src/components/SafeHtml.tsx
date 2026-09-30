import DOMPurify from "dompurify";
import { useMemo } from "react";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["p", "strong", "em", "ul", "ol", "li", "a", "br", "b", "i"],
        ALLOWED_ATTR: ["href", "target", "rel"],
      }),
    [html]
  );
  // eslint-disable-next-line react/no-danger
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
