import type { LucideIcon } from "lucide-react";
import { useId } from "react";

interface Props {
  title: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}

/** Translucent iOS-style card with a small uppercase header, which also names the region. */
export default function Card({ title, icon: Icon, className, children }: Props) {
  const titleId = useId();
  return (
    <section className={`card ${className ?? ""}`} aria-labelledby={titleId}>
      <h2 className="card-title" id={titleId}>
        <Icon size={14} strokeWidth={2} aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}
