import { usePath } from "./router";
import { Header } from "./components/layout/Header";
import type { NavItem } from "./components/layout/NavTabs";
import { DocIcon, BookIcon, ListIcon } from "./components/icons";
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
const GeneratorIcon = <DocIcon />;
const RegistriesIcon = <BookIcon />;
const OrdersIcon = <ListIcon />;

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
