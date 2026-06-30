import { usePath } from "./router";
import { Header } from "./components/layout/Header";
import type { NavItem } from "./components/layout/NavTabs";
import DashboardPage from "./pages/DashboardPage";
import GeneratorPage from "./pages/GeneratorPage";
import OrderDirectivesPage from "./pages/OrderDirectivesPage";
import RegistriesPage from "./pages/RegistriesPage";
import RegistryPage from "./pages/RegistryPage";

const DashboardIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);
const GeneratorIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h6.586A2 2 0 0114 2.586L16.414 5A2 2 0 0117 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm6 1a1 1 0 10-2 0v5.586L6.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L10 10.586V5z" clipRule="evenodd" />
  </svg>
);
const RegistriesIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
  </svg>
);
const OrdersIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

export default function App() {
  const path = usePath();

  const isOrders = path.startsWith("/order-directives");
  const isRegistries = path.startsWith("/registries");
  const isGenerator = path.startsWith("/generator");
  const isDashboard = !isOrders && !isRegistries && !isGenerator;

  // Extract registry id from /registries/:id
  const registryMatch = path.match(/^\/registries\/([^/]+)/);
  const registryId = registryMatch ? registryMatch[1] : null;

  const navItems: NavItem[] = [
    { to: "/", label: "Обзор", icon: DashboardIcon, active: isDashboard },
    { to: "/generator", label: "Генератор ИД", icon: GeneratorIcon, active: isGenerator },
    { to: "/registries", label: "Реестры актов", icon: RegistriesIcon, active: isRegistries },
    { to: "/order-directives", label: "Приказы и распоряжения", icon: OrdersIcon, active: isOrders },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      <Header items={navItems} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {isOrders && <OrderDirectivesPage />}
        {isRegistries && registryId && <RegistryPage registryId={registryId} />}
        {isRegistries && !registryId && <RegistriesPage />}
        {isGenerator && <GeneratorPage />}
        {isDashboard && <DashboardPage />}
      </main>
    </div>
  );
}
