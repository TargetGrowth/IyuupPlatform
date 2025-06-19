import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  BarChart, 
  Settings,
  DollarSign,
  Link2,
  Wallet,
  Gift,
  Percent,
  Package,
  Shield,
  UserCog
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Produtos",
    href: "/courses",
    icon: ShoppingBag,
  },
  {
    name: "Clientes",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Vendas",
    href: "/sales",
    icon: CreditCard,
  },

  {
    name: "Cupons",
    href: "/coupons",
    icon: Percent,
  },
  {
    name: "Produtos para Afiliação",
    href: "/affiliate-products",
    icon: Users,
  },
  {
    name: "Painel Admin",
    href: "/admin",
    icon: UserCog,
    adminOnly: true,
  },
  {
    name: "Saques",
    href: "/withdrawals",
    icon: Wallet,
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: BarChart,
  },
  {
    name: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAdmin = user && ((user as any)?.role === 'admin' || (user as any)?.role === 'super_admin');

  return (
    <div className="w-64 bg-white shadow-sm h-screen fixed left-0 top-16 overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            // Skip admin-only items if user is not admin
            if (item.adminOnly && !isAdmin) {
              return null;
            }

            const Icon = item.icon;
            const isActive = location === item.href || 
              (item.href === "/dashboard" && location === "/");
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                    isActive
                      ? "text-primary-blue bg-light-blue"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
