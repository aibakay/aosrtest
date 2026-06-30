import { NavTabs, type NavItem } from "./NavTabs";

export function Header({ items }: { items: NavItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0013.414 6L10 2.586A2 2 0 008.586 2H4zm5 1.5V6a1 1 0 001 1h2.5L9 3.5zM5 11a1 1 0 100 2h6a1 1 0 100-2H5zm0 3a1 1 0 100 2h4a1 1 0 100-2H5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-wide text-ink-900">
              Генератор исполнительной документации
            </h1>
            <p className="text-xs text-ink-400">Формирование актов, реестров и приказов</p>
          </div>
        </div>

        <NavTabs items={items} />
      </div>
    </header>
  );
}
