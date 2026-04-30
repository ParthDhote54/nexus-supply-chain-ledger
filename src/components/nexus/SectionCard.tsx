import type { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-premium rounded-2xl p-6 ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          {icon && (
            <div className="icon-chip shrink-0 [&_svg]:size-[20px]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-[1.05rem] font-bold tracking-tight truncate text-display">{title}</h2>
            {subtitle && <p className="text-[0.8rem] text-muted-foreground truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
