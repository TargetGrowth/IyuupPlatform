import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ShoppingCart, TrendingUp, Percent } from "lucide-react";

interface MetricsCardsProps {
  analytics?: {
    balance: number;
    todaySales: number;
    monthSales: number;
    conversionRate: number;
  };
}

export default function MetricsCards({ analytics }: MetricsCardsProps) {
  const metrics = [
    {
      title: "Saldo Disponível",
      value: `R$ ${analytics?.balance?.toFixed(2) || "0,00"}`,
      change: "+12.5%",
      changeText: "vs mês anterior",
      icon: Wallet,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
    },
    {
      title: "Vendas Hoje",
      value: `R$ ${analytics?.todaySales?.toFixed(2) || "0,00"}`,
      change: "+8.2%",
      changeText: "vs ontem",
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-primary-blue",
      valueColor: "text-primary-blue",
    },
    {
      title: "Vendas 30 Dias",
      value: `R$ ${analytics?.monthSales?.toFixed(2) || "0,00"}`,
      change: "+18.7%",
      changeText: "vs mês anterior",
      icon: TrendingUp,
      iconBg: "bg-orange-100",
      iconColor: "text-secondary-orange",
      valueColor: "text-secondary-orange",
    },
    {
      title: "Conversão",
      value: `${analytics?.conversionRate?.toFixed(1) || "0"}%`,
      change: "+0.3%",
      changeText: "vs mês anterior",
      icon: Percent,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      valueColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </p>
                  <p className={`text-3xl font-bold ${metric.valueColor}`}>
                    {metric.value}
                  </p>
                </div>
                <div className={`${metric.iconBg} p-3 rounded-full`}>
                  <Icon className={`${metric.iconColor} h-6 w-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">
                  {metric.change}
                </span>
                <span className="text-gray-500 text-sm ml-2">
                  {metric.changeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
