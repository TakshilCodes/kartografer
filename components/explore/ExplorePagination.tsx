import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildExploreHref, type ExploreQuery } from "@/lib/explore/explore-query";

export default function ExplorePagination({
  query,
  currentPage,
  totalPages,
}: {
  query: ExploreQuery;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
  );

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 rounded-[28px] border border-border bg-card p-3 shadow-sm">
      <PageLink disabled={currentPage <= 1} href={buildExploreHref(query, { page: currentPage - 1 })}>
        <ChevronLeft className="h-4 w-4" />
        Previous
      </PageLink>

      {pages.map((page, index) => {
        const previous = pages[index - 1];
        const showGap = previous && page - previous > 1;

        return (
          <span key={page} className="flex items-center gap-2">
            {showGap ? <span className="px-1 text-sm font-black text-secondary-foreground">...</span> : null}
            <Link
              href={buildExploreHref(query, { page })}
              className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-black transition ${
                page === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-card-secondary"
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}

      <PageLink disabled={currentPage >= totalPages} href={buildExploreHref(query, { page: currentPage + 1 })}>
        Next
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  children,
  href,
  disabled,
}: {
  children: React.ReactNode;
  href: string;
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card-secondary px-4 text-sm font-black text-muted-foreground opacity-60">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-black text-foreground transition hover:bg-card-secondary"
    >
      {children}
    </Link>
  );
}