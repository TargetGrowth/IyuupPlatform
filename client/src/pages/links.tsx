import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, Plus, Eye, Trash2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";

interface SalesLink {
  id: string;
  productId: number;
  productTitle: string;
  customTitle: string;
  customPrice: number;
  originalPrice: number;
  link: string;
  createdAt: string;
}

export default function Links() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: salesLinks, refetch: refetchLinks } = useQuery({
    queryKey: ["/api/sales-links"],
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: { courseId: number; customTitle: string; customPrice: string }) => {
      return await apiRequest("POST", "/api/sales-links", {
        courseId: data.courseId,
        customTitle: data.customTitle,
        customPrice: parseFloat(data.customPrice),
      });
    },
    onSuccess: () => {
      toast({
        title: "Link gerado com sucesso!",
        description: "Seu link de venda foi criado e está pronto para uso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-links"] });
      setSelectedProduct("");
      setCustomTitle("");
      setCustomPrice("");
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o link de venda",
        variant: "destructive",
      });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/sales-links/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Link removido",
        description: "O link de venda foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-links"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o link",
        variant: "destructive",
      });
    },
  });

  const generateRandomPrice = () => {
    const prices = [47, 67, 87, 97, 127, 147, 167, 197];
    return prices[Math.floor(Math.random() * prices.length)];
  };

  const generateLink = () => {
    if (!selectedProduct || !customTitle || !customPrice) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createLinkMutation.mutate({
      courseId: parseInt(selectedProduct),
      customTitle,
      customPrice,
    });
  };

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const generateRandomTitle = () => {
    const selectedCourse = Array.isArray(courses) && courses.find((course: Course) => course.id.toString() === selectedProduct);
    if (selectedCourse) {
      const titles = [
        `🔥 OFERTA ESPECIAL - ${selectedCourse.title}`,
        `⚡ DESCONTO LIMITADO - ${selectedCourse.title}`,
        `🎯 PROMOÇÃO EXCLUSIVA - ${selectedCourse.title}`,
        `💎 OFERTA VIP - ${selectedCourse.title}`,
        `🚀 ÚLTIMA CHANCE - ${selectedCourse.title}`,
      ];
      setCustomTitle(titles[Math.floor(Math.random() * titles.length)]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="p-8 pt-20">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gerenciador de Links</h1>
                  <p className="text-gray-600 mt-1">Crie links personalizados com diferentes títulos e preços</p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-primary-blue hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Link
                </Button>
              </div>

              {showCreateForm && (
                <Card className="mb-6 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Link2 className="h-5 w-5 mr-2 text-blue-600" />
                      Criar Novo Link de Venda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="product">Produto *</Label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(courses) && courses.map((course: Course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title} - R$ {parseFloat(course.price).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="custom-price">Preço Personalizado (R$) *</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="custom-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            placeholder="97.00"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCustomPrice(generateRandomPrice().toString())}
                            className="px-3"
                          >
                            Gerar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="custom-title">Título Personalizado *</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="custom-title"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Ex: 🔥 OFERTA ESPECIAL - Seu Produto"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateRandomTitle}
                          disabled={!selectedProduct}
                          className="px-3"
                        >
                          Gerar
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={generateLink}
                        className="flex-1 bg-primary-blue hover:bg-blue-700"
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Gerar Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Links de Venda Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.isArray(salesLinks) && salesLinks.length > 0 ? (
                        salesLinks.map((link: any) => (
                          <div key={link.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium text-gray-900">{link.customTitle}</h3>
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Ativo
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">Produto: {link.courseName}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                  <span>Preço: R$ {parseFloat(link.customPrice).toFixed(2)}</span>
                                  <span>Original: R$ {parseFloat(link.originalPrice).toFixed(2)}</span>
                                  <span>Criado: {new Date(link.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                  <code className="text-sm text-blue-600 flex-1">
                                    {window.location.origin}/checkout/{link.linkId}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(`${window.location.origin}/checkout/${link.linkId}`)}
                                    className="shrink-0"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => deleteLinkMutation.mutate(link.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum link criado ainda</h3>
                          <p className="text-gray-600 mb-4">Crie seu primeiro link de venda personalizado</p>
                          <Button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-primary-blue hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Primeiro Link
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}