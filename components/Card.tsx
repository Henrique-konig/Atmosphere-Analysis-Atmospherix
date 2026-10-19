import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}

/** Translucent iOS-style card with a small uppercase header. */
export default function Card({ title, icon: Icon, className, children }: Props) {
  return (
    <section className={`card ${className ?? ""}`} aria-label={title}>
      <h2 className="card-title">
        <Icon size={14} strokeWidth={2} aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}
