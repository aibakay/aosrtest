import type { ReactNode } from "react";
import { Link } from "../../router";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}

export function NavTabs({ items }: { items: NavItem[] }) {
  return (
    <nav className="flex flex-wrap justify-end gap-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-label={item.label}
          title={item.label}
          className={[
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
            item.active ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-100 hover:text-ink-700",
          ].join(" ")}
        >
          {item.icon}
          <span className="hidden sm:inline">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
