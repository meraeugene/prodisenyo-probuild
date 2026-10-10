"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type NavigationLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

// Prefetch the loading shell in the viewport, then the full page on intent.
// This avoids running every visible destination's database queries at startup.
export default function NavigationLink({
  href,
  onMouseEnter,
  onFocus,
  ...props
}: NavigationLinkProps) {
  const [prefetchHref, setPrefetchHref] = useState<typeof href | null>(null);

  return (
    <Link
      {...props}
      href={href}
      prefetch={prefetchHref === href ? true : "auto"}
      onMouseEnter={(event) => {
        setPrefetchHref(href);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setPrefetchHref(href);
        onFocus?.(event);
      }}
    />
  );
}
