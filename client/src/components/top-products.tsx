import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Eye } from "lucide-react";

interface TopProductsProps {
  products?: Array<{
    id: number;
    title: string;
    sales: number;
    revenue: number;
    growth: string;
  }>;
  isLoading: boolean;
}

export default function TopProducts({ products, isLoading }: TopProductsProps) {
  // Default mock data if no products
  const defaultProducts = [
    {
      id: 1,
      title: "Curso de Marketing Digital",
      sales: 127,
      revenue: 15240,
      growth: "+23%",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
    },
    {
      id: 2,
      title: "Excel do Zero ao Avançado",
      sales: 89,
      revenue: 8900,
      growth: "+15%",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
    },
    {
      id: 3,
      title: "Python para Iniciantes",
      sales: 76,
      revenue: 7600,
      growth: "+31%",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
    },
  ];

  const displayProducts = products && products.length > 0 ? products : defaultProducts;

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Top Produtos Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Top Produtos Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayProducts.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhum produto ainda
            </h3>
            <p className="text-gray-600">
              Crie seus primeiros cursos para vê-los aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="ml-4">
                    <p className="font-medium text-gray-800">
                      {product.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {product.sales} vendas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">
                    R$ {product.revenue.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm text-green-600">
                    {product.growth}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full mt-6 text-primary-blue font-medium hover:bg-blue-50"
        >
          Ver Todos os Produtos
        </Button>
      </CardContent>
    </Card>
  );
}
