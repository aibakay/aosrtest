import { Link, usePath } from "./router";
import GeneratorPage from "./pages/GeneratorPage";
import OrderDirectivesPage from "./pages/OrderDirectivesPage";

const navItems = [
  { to: "/", label: "Генератор ИД" },
  { to: "/order-directives", label: "Приказы и распоряжения" },
];

export default function App() {
  const path = usePath();
  const isOrders = path.startsWith("/order-directives");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Автогенератор ИД</h1>
          <p className="mt-1 text-sm text-gray-500">Формирование исполнительной документации</p>
        </div>

        <nav className="mb-8 flex gap-1 border-b border-gray-200">
          {navItems.map((item) => {
            const active = item.to === "/order-directives" ? isOrders : !isOrders;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
                  active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isOrders ? <OrderDirectivesPage /> : <GeneratorPage />}
      </div>
    </div>
  );
}
