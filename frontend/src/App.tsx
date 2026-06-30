import { Link, usePath } from "./router";
import GeneratorPage from "./pages/GeneratorPage";
import OrderDirectivesPage from "./pages/OrderDirectivesPage";
import RegistriesPage from "./pages/RegistriesPage";
import RegistryPage from "./pages/RegistryPage";

const navItems = [
  { to: "/", label: "Генератор ИД" },
  { to: "/registries", label: "Реестры актов" },
  { to: "/order-directives", label: "Приказы и распоряжения" },
];

export default function App() {
  const path = usePath();

  const isOrders = path.startsWith("/order-directives");
  const isRegistries = path.startsWith("/registries");
  const isGenerator = !isOrders && !isRegistries;

  // Extract registry id from /registries/:id
  const registryMatch = path.match(/^\/registries\/([^/]+)/);
  const registryId = registryMatch ? registryMatch[1] : null;

  const activeFor = (item: { to: string }) => {
    if (item.to === "/order-directives") return isOrders;
    if (item.to === "/registries") return isRegistries;
    return isGenerator;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Автогенератор ИД</h1>
          <p className="mt-1 text-sm text-gray-500">Формирование исполнительной документации</p>
        </div>

        <nav className="mb-8 flex gap-1 border-b border-gray-200">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
                activeFor(item)
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isOrders && <OrderDirectivesPage />}
        {isRegistries && registryId && <RegistryPage registryId={registryId} />}
        {isRegistries && !registryId && <RegistriesPage />}
        {isGenerator && <GeneratorPage />}
      </div>
    </div>
  );
}
