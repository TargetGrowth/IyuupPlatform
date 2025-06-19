import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Edit2, Save, X, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";

export default function Billing() {
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ courseId, price }: { courseId: number; price: string }) => {
      return await apiRequest("PATCH", `/api/courses/${courseId}`, { price: parseFloat(price) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Preço atualizado!",
        description: "O preço do produto foi atualizado com sucesso.",
      });
      setEditingProduct(null);
      setNewPrice("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar preço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateRandomPrice = () => {
    const prices = [97, 147, 197, 247, 297, 397, 497, 597, 797, 997];
    return prices[Math.floor(Math.random() * prices.length)];
  };

  const handleEditPrice = (courseId: number, currentPrice: string) => {
    setEditingProduct(courseId);
    setNewPrice(currentPrice);
  };

  const handleSavePrice = (courseId: number) => {
    if (!newPrice) return;
    updatePriceMutation.mutate({ courseId, price: newPrice });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewPrice("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <DashboardSidebar />
          <div className="flex-1 ml-64 pt-20 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="flex">
        <DashboardSidebar />
        
        <div className="flex-1 ml-64 pt-20 p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Cobrança</h2>
                <p className="text-gray-600">Gerencie os preços dos seus produtos</p>
              </div>
            </div>

            {/* Pricing Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Preços Sugeridos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded text-center">R$ 97</div>
                    <div className="bg-gray-50 p-2 rounded text-center">R$ 147</div>
                    <div className="bg-gray-50 p-2 rounded text-center">R$ 197</div>
                    <div className="bg-gray-50 p-2 rounded text-center">R$ 247</div>
                    <div className="bg-gray-50 p-2 rounded text-center">R$ 297</div>
                    <div className="bg-gray-50 p-2 rounded text-center">R$ 397</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Estratégia de Preços
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Entrada:</span>
                      <span className="font-medium">R$ 97-147</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intermediário:</span>
                      <span className="font-medium">R$ 197-297</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span className="font-medium">R$ 397-997</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Gerador de Preços</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setNewPrice(generateRandomPrice().toString())}
                    className="w-full"
                    variant="outline"
                  >
                    Gerar Preço Aleatório
                  </Button>
                  {newPrice && (
                    <div className="mt-2 text-center text-lg font-bold text-green-600">
                      R$ {newPrice}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(courses) && courses.map((course: Course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="aspect-video bg-gradient-to-br from-primary-blue/20 to-secondary-orange/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <DollarSign className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    {course.category && (
                      <Badge variant="outline" className="w-fit">
                        {course.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {editingProduct === course.id ? (
                        <div className="space-y-3">
                          <Label htmlFor={`price-${course.id}`}>Novo Preço (R$)</Label>
                          <Input
                            id={`price-${course.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            placeholder="197.00"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSavePrice(course.id)}
                              disabled={updatePriceMutation.isPending}
                              className="flex-1"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setNewPrice(generateRandomPrice().toString())}
                            className="w-full"
                          >
                            Gerar Preço Aleatório
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Preço Atual:</span>
                            <span className="text-lg font-bold text-green-600">
                              R$ {parseFloat(course.price).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPrice(course.id, course.price)}
                            className="w-full"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Alterar Preço
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {(!courses || !Array.isArray(courses) || courses.length === 0) && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600 mb-4">Crie seu primeiro produto para gerenciar preços</p>
                <Button onClick={() => window.location.href = "/courses/new"}>
                  Criar Primeiro Produto
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}