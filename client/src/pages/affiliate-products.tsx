import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Eye, Heart, ExternalLink, Link, Copy, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { useKyc } from "@/hooks/useKyc";
import { KycWarning } from "@/components/kyc-warning";

interface AffiliateProduct {
  id: number;
  title: string;
  description: string;
  price: string;
  thumbnailUrl: string;
  category: string;
  allowsAffiliates: boolean;
  defaultAffiliateCommission: string;
  createdAt: string;
  producer: {
    fullName: string;
  };
  isAlreadyAffiliate?: boolean;
  hasPendingApplication?: boolean;
}

interface AffiliateLink {
  linkId: string;
  courseName: string;
  commission: string;
  clicks: number;
  sales: number;
  earnings: string;
}

export default function AffiliateProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { kycStatus, hasSubmittedDocuments, needsKycSubmission } = useKyc();

  const { data: affiliateProducts, isLoading } = useQuery({
    queryKey: ['/api/affiliate-products'],
  });

  const { data: affiliateLinks = [], isLoading: isLoadingLinks } = useQuery<AffiliateLink[]>({
    queryKey: ['/api/affiliate-links'],
  });

  const applyAffiliationMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return await apiRequest('POST', `/api/affiliate-applications`, { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate-products'] });
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de afiliação foi enviada ao produtor.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateLinkMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return await apiRequest('POST', '/api/affiliate-links/generate', { courseId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate-links'] });
      // Copy link to clipboard
      navigator.clipboard.writeText(data.fullUrl);
      toast({
        title: "Link gerado!",
        description: "Link de afiliado copiado para a área de transferência.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApplyAffiliation = (courseId: number) => {
    applyAffiliationMutation.mutate(courseId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="p-8 pt-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Sistema de Afiliados</h1>
                <p className="mt-2 text-gray-600">
                  Gerencie seus produtos afiliados e links de promoção
                </p>
              </div>

              <KycWarning 
                kycStatus={kycStatus} 
                hasSubmittedDocuments={hasSubmittedDocuments} 
              />

              <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="products">Produtos Disponíveis</TabsTrigger>
                  <TabsTrigger value="links">Meus Links de Afiliado</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6">
                  {isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                          <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-200 rounded"></div>
                              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.isArray(affiliateProducts) && affiliateProducts.length > 0 ? (
                        affiliateProducts.map((product: AffiliateProduct) => (
                          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative">
                              <img
                                src={product.thumbnailUrl || "https://via.placeholder.com/400x200"}
                                alt={product.title}
                                className="w-full h-48 object-cover"
                              />
                              <Badge 
                                className="absolute top-2 right-2 bg-green-500 text-white"
                              >
                                {parseFloat(product.defaultAffiliateCommission).toFixed(0)}% comissão
                              </Badge>
                            </div>
                            
                            <CardHeader>
                              <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                {product.description}
                              </CardDescription>
                            </CardHeader>
                            
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-2xl font-bold text-green-600">
                                    R$ {parseFloat(product.price).toFixed(2)}
                                  </span>
                                  <Badge variant="outline">{product.category}</Badge>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Users className="w-4 h-4 mr-1" />
                                  Produtor: {product.producer.fullName}
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center text-green-600">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    Comissão: {parseFloat(product.defaultAffiliateCommission).toFixed(1)}%
                                  </div>
                                  <div className="text-gray-500">
                                    ~R$ {(parseFloat(product.price) * parseFloat(product.defaultAffiliateCommission) / 100).toFixed(2)} por venda
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {product.isAlreadyAffiliate ? (
                                    <div className="space-y-2 w-full">
                                      <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
                                        <Heart className="w-4 h-4 mr-2" />
                                        Já é afiliado
                                      </Badge>
                                      <Button 
                                        onClick={() => generateLinkMutation.mutate(product.id)}
                                        disabled={generateLinkMutation.isPending}
                                        variant="outline"
                                        className="w-full"
                                      >
                                        <Link className="w-4 h-4 mr-2" />
                                        Gerar Link de Afiliado
                                      </Button>
                                    </div>
                                  ) : product.hasPendingApplication ? (
                                    <Button className="flex-1" disabled variant="outline">
                                      <Eye className="w-4 h-4 mr-2" />
                                      Aguardando aprovação
                                    </Button>
                                  ) : (
                                    <Button 
                                      className="flex-1"
                                      onClick={() => handleApplyAffiliation(product.id)}
                                      disabled={applyAffiliationMutation.isPending}
                                    >
                                      {applyAffiliationMutation.isPending ? 'Solicitando...' : 'Solicitar Afiliação'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full">
                          <Card className="text-center py-12">
                            <CardContent>
                              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                              <h3 className="text-lg font-semibold mb-2">Nenhum produto disponível</h3>
                              <p className="text-gray-600 mb-4">
                                Não há produtos que aceitam afiliados no momento.
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="links" className="mt-6">
                  {isLoadingLinks ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-gray-500">Carregando links...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(affiliateLinks) && affiliateLinks.map((link: AffiliateLink) => (
                        <Card key={link.linkId} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{link.courseName}</h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  {link.clicks} cliques
                                </div>
                                <div className="flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                  {link.sales} vendas
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-green-600">
                                    R$ {parseFloat(link.earnings).toFixed(2)} ganhos
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium">
                                    {link.commission}% comissão
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Input
                                value={`${window.location.origin}/aff/${link.linkId}`}
                                readOnly
                                className="w-64"
                              />
                              <Button
                                onClick={() => copyToClipboard(`${window.location.origin}/aff/${link.linkId}`)}
                                variant="outline"
                                size="sm"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {affiliateLinks.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-gray-500 text-lg">Você ainda não possui links de afiliado</div>
                          <p className="text-gray-400 mt-2">
                            Vá para a aba "Produtos Disponíveis" para gerar seus primeiros links
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}