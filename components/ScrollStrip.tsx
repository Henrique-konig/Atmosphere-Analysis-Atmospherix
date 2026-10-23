"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";

interface Props {
  className: string;
  label: string;
  /** On `resetKey` changes the list scrolls to the first item matching this selector (or the start). */
  startSelector?: string;
  resetKey?: unknown;
  children: React.ReactNode;
}

/**
 * A horizontally scrolling list. Touch screens swipe it; on desktop the arrows and a thin
 * scrollbar do the job, since a mouse wheel does not scroll sideways.
 */
export default function ScrollStrip({
  className,
  label,
  startSelector,
  resetKey,
  children,
}: Props) {
  const innerRef = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, children]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const start = startSelector ? el.querySelector<HTMLElement>(startSelector) : null;
    const padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    el.scrollLeft = start ? start.offsetLeft - el.offsetLeft - padding : 0;
  }, [resetKey, startSelector]);

  const scrollBy = (direction: -1 | 1) =>
    innerRef.current?.scrollBy({
      left: direction * innerRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });

  return (
    <div className="strip">
      <ol
        ref={innerRef}
        className={className}
        tabIndex={0}
        aria-label={label}
        onScroll={update}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") scrollBy(1);
          if (e.key === "ArrowLeft") scrollBy(-1);
        }}
      >
        {children}
      </ol>
      {edges.left && (
        <button
          type="button"
          className="strip-arrow strip-arrow-left"
          onClick={() => scrollBy(-1)}
          aria-label={t("hourly.previous")}
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
      )}
      {edges.right && (
        <button
          type="button"
          className="strip-arrow strip-arrow-right"
          onClick={() => scrollBy(1)}
          aria-label={t("hourly.next")}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
