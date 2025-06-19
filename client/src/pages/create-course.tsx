import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useKyc } from "@/hooks/useKyc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, X, DollarSign, Users, UserPlus, Search, Trash2, Mail, Percent, Link2, Copy, ExternalLink, Clock, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import type { Category } from "@shared/schema";
import { KycWarning } from "@/components/kyc-warning";

const courseSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.string().min(1, "Preço é obrigatório"),
  image: z.string().url("URL da imagem deve ser válida").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  refundPeriod: z.string().default("30"),
  allowsAffiliates: z.boolean().default(false),
  defaultAffiliateCommission: z.string().default("0"),
});

type CourseForm = z.infer<typeof courseSchema>;

// Order Bumps Tab Component
function OrderBumpsTab({ courseId }: { courseId?: string }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [customPrice, setCustomPrice] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orderBumps = [], isLoading: orderBumpsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/order-bumps`],
    enabled: !!courseId,
  });

  const { data: availableProducts = [] } = useQuery({
    queryKey: ['/api/courses'],
  });

  const createOrderBumpMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/order-bumps', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/order-bumps`] });
      setShowCreateDialog(false);
      setSelectedProduct(null);
      setCustomPrice("");
      toast({
        title: "Order bump criado",
        description: "Produto adicional foi configurado com sucesso!",
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

  const deleteOrderBumpMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/order-bumps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/order-bumps`] });
      toast({
        title: "Order bump removido",
        description: "Produto adicional foi removido.",
      });
    },
  });

  const handleCreateOrderBump = () => {
    if (!selectedProduct || !customPrice) {
      toast({
        title: "Erro",
        description: "Selecione um produto e defina o preço promocional",
        variant: "destructive",
      });
      return;
    }

    createOrderBumpMutation.mutate({
      courseId: parseInt(courseId!),
      title: selectedProduct.title,
      description: `Adicione ${selectedProduct.title} por apenas R$ ${customPrice}`,
      price: parseFloat(customPrice),
      image: selectedProduct.thumbnailUrl,
      orderBumpProductId: selectedProduct.id,
      isActive: true,
    });
  };

  const availableProductsFiltered = Array.isArray(availableProducts) ? availableProducts.filter((product: any) => 
    product.id !== parseInt(courseId!) && 
    (!Array.isArray(orderBumps) || !orderBumps.some((bump: any) => bump.orderBumpProductId === product.id))
  ) : [];

  if (orderBumpsLoading) {
    return <div className="flex justify-center py-8">Carregando order bumps...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-600" />
            Order Bumps - Produtos Adicionais
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Order Bump
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Order Bump</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Produto</Label>
                  <Select value={selectedProduct?.id?.toString() || ""} onValueChange={(value) => {
                    const product = availableProductsFiltered.find((p: any) => p.id.toString() === value);
                    setSelectedProduct(product);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProductsFiltered.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.title} - R$ {product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Preço Promocional (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="97.00"
                  />
                  {selectedProduct && (
                    <p className="text-sm text-gray-600 mt-1">
                      Preço original: R$ {selectedProduct.price}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateOrderBump} disabled={createOrderBumpMutation.isPending}>
                    {createOrderBumpMutation.isPending ? "Criando..." : "Criar Order Bump"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!Array.isArray(orderBumps) || orderBumps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Plus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum order bump configurado</p>
              <p className="text-sm">Adicione produtos extras para aumentar o valor do pedido</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {orderBumps.map((bump: any) => (
                <div key={bump.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {bump.image && (
                      <img src={bump.image} alt={bump.title} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div>
                      <h4 className="font-medium">{bump.title}</h4>
                      <p className="text-sm text-gray-600">{bump.description}</p>
                      <p className="text-lg font-bold text-green-600">R$ {bump.price}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteOrderBumpMutation.mutate(bump.id)}
                    disabled={deleteOrderBumpMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Ofertas Tab Component (Sales Links)
function OfertasTab({ courseId }: { courseId?: string }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: salesLinks = [], isLoading } = useQuery({
    queryKey: ['/api/sales-links'],
  });

  const createSalesLinkMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/sales-links', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-links'] });
      setShowCreateDialog(false);
      setCustomTitle("");
      setCustomPrice("");
      toast({
        title: "Sucesso",
        description: "Link de vendas criado com sucesso!",
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

  const deleteSalesLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/sales-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-links'] });
      toast({
        title: "Sucesso",
        description: "Link de vendas excluído com sucesso!",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    createSalesLinkMutation.mutate({
      courseId: parseInt(courseId),
      customTitle: customTitle || undefined,
      customPrice: customPrice ? parseFloat(customPrice) : undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  if (!courseId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Salve o produto primeiro para gerenciar ofertas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Links de Vendas</h3>
          <p className="text-sm text-gray-600">Crie links personalizados com preços diferenciados</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Link de Vendas</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customTitle">Título Personalizado (Opcional)</Label>
                <Input
                  id="customTitle"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Deixe vazio para usar o título original"
                />
              </div>
              <div>
                <Label htmlFor="customPrice">Preço Personalizado (Opcional)</Label>
                <Input
                  id="customPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Deixe vazio para usar o preço original"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createSalesLinkMutation.isPending}
                >
                  {createSalesLinkMutation.isPending ? "Criando..." : "Criar Link"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando links...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Array.isArray(salesLinks) && salesLinks.length > 0 ? (
            salesLinks
              .filter((link: any) => link.courseId === parseInt(courseId))
              .map((link: any) => (
                <Card key={link.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {link.customTitle || link.courseName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Preço: R$ {link.customPrice || link.originalPrice}
                        </p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Link2 className="h-4 w-4 mr-1" />
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {getBaseUrl()}/checkout/{link.linkId}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${getBaseUrl()}/checkout/${link.linkId}`)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`${getBaseUrl()}/checkout/${link.linkId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Abrir
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSalesLinkMutation.mutate(link.id)}
                          disabled={deleteSalesLinkMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500">
                  <Link2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum link criado</h3>
                  <p className="text-sm mb-4">
                    Crie seu primeiro link de vendas personalizado
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Co-Producer Tab Component
function CoProducerTab({ courseId }: { courseId?: string }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [percentage, setPercentage] = useState("50");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coproducers = [] } = useQuery<any[]>({
    queryKey: [`/api/courses/${courseId}/coproducers`],
    enabled: !!courseId,
  });

  const { data: pendingInvitations = [] } = useQuery<any[]>({
    queryKey: [`/api/courses/${courseId}/pending-invitations`],
    enabled: !!courseId,
  });

  const searchUserMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("GET", `/api/users/search?email=${encodeURIComponent(email)}`);
    },
    onSuccess: (user) => {
      if (user) {
        setSelectedUser(user);
      } else {
        toast({
          title: "Usuário não encontrado",
          description: "Nenhum usuário encontrado com este e-mail. Você pode enviar um convite.",
          variant: "destructive",
        });
      }
    },
  });

  const addCoproducerMutation = useMutation({
    mutationFn: async (data: { courseId: string; userId: number; percentage: number }) => {
      return await apiRequest("POST", `/api/courses/${courseId}/coproducers`, data);
    },
    onSuccess: () => {
      toast({
        title: "Co-produtor adicionado",
        description: "Co-produtor foi adicionado com sucesso ao curso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "coproducers"] });
      setSelectedUser(null);
      setSearchEmail("");
      setPercentage("50");
    },
  });

  const removeCoproducerMutation = useMutation({
    mutationFn: async (coproducerId: number) => {
      return await apiRequest("DELETE", `/api/courses/${courseId}/coproducers/${coproducerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Co-produtor removido",
        description: "Co-produtor foi removido do curso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "coproducers"] });
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (data: { email: string; type: 'coproducer' | 'affiliate'; percentage?: number; commission?: number; courseId?: string }) => {
      return await apiRequest("POST", "/api/invitations/send", { ...data, courseId });
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado",
        description: "Convite foi enviado com sucesso para o e-mail informado.",
      });
      setShowInviteDialog(false);
      setInviteEmail("");
      setSearchEmail("");
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/pending-invitations`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Não foi possível enviar o convite",
        variant: "destructive",
      });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest("DELETE", `/api/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/pending-invitations`] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Gerenciar Co-Produtores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search-email">Buscar usuário por e-mail</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="search-email"
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="flex-1"
              />
              <Button
                onClick={() => searchUserMutation.mutate(searchEmail)}
                disabled={!searchEmail || searchUserMutation.isPending}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedUser && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedUser.fullName}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="percentage">Percentual de participação (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="1"
                      max="99"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => addCoproducerMutation.mutate({
                      courseId: courseId!,
                      userId: selectedUser.id,
                      percentage: parseFloat(percentage),
                    })}
                    disabled={addCoproducerMutation.isPending}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Co-Produtor
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedUser && searchEmail && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setInviteEmail(searchEmail);
                  setShowInviteDialog(true);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar convite para {searchEmail}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {Array.isArray(coproducers) && coproducers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Co-Produtores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coproducers.map((coproducer: any) => (
                <div key={coproducer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{coproducer.user?.fullName || 'Nome não disponível'}</p>
                    <p className="text-sm text-gray-600">{coproducer.user?.email || 'Email não disponível'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium flex items-center">
                      <Percent className="h-3 w-3 mr-1" />
                      {coproducer.percentage}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCoproducerMutation.mutate(coproducer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Array.isArray(pendingInvitations) && pendingInvitations.filter(inv => inv.type === 'coproducer').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Mail className="h-5 w-5 mr-2 text-orange-600" />
              Co-Produtores Aguardando Convite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations
                .filter(inv => inv.type === 'coproducer')
                .map((invitation: any) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">{invitation.recipientEmail}</p>
                    <p className="text-sm text-gray-600">
                      {invitation.percentage}% de participação • 
                      Enviado em {new Date(invitation.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-orange-600">
                      Expira em {new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                    disabled={cancelInvitationMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Convite para Co-Produtor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">E-mail do convidado</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-percentage">Percentual de participação (%)</Label>
              <Input
                id="invite-percentage"
                type="number"
                min="1"
                max="99"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => sendInviteMutation.mutate({
                  email: inviteEmail,
                  type: 'coproducer',
                  percentage: parseFloat(percentage)
                })}
                disabled={sendInviteMutation.isPending || !inviteEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Affiliate Tab Component
function AffiliateTab({ courseId }: { courseId?: string }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [commission, setCommission] = useState("30");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: affiliates = [] } = useQuery<any[]>({
    queryKey: [`/api/courses/${courseId}/affiliates`],
    enabled: !!courseId,
  });

  const { data: pendingInvitations = [] } = useQuery<any[]>({
    queryKey: [`/api/courses/${courseId}/pending-invitations`],
    enabled: !!courseId,
  });

  const { data: affiliateApplications = [] } = useQuery<any[]>({
    queryKey: [`/api/courses/${courseId}/affiliate-applications`],
    enabled: !!courseId,
  });

  const searchUserMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("GET", `/api/users/search?email=${encodeURIComponent(email)}`);
    },
    onSuccess: (user) => {
      if (user) {
        setSelectedUser(user);
      } else {
        toast({
          title: "Usuário não encontrado",
          description: "Nenhum usuário encontrado com este e-mail. Você pode enviar um convite.",
          variant: "destructive",
        });
      }
    },
  });

  const addAffiliateMutation = useMutation({
    mutationFn: async (data: { courseId: string; userId: number; commission: number }) => {
      return await apiRequest("POST", `/api/courses/${courseId}/affiliates`, data);
    },
    onSuccess: () => {
      toast({
        title: "Afiliado adicionado",
        description: "Afiliado foi adicionado com sucesso ao curso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "affiliates"] });
      setSelectedUser(null);
      setSearchEmail("");
      setCommission("30");
    },
  });

  const removeAffiliateMutation = useMutation({
    mutationFn: async (affiliateId: number) => {
      return await apiRequest("DELETE", `/api/courses/${courseId}/affiliates/${affiliateId}`);
    },
    onSuccess: () => {
      toast({
        title: "Afiliado removido",
        description: "Afiliado foi removido do curso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "affiliates"] });
    },
  });

  const sendAffiliateInviteMutation = useMutation({
    mutationFn: async (data: { email: string; type: 'coproducer' | 'affiliate'; percentage?: number; commission?: number; courseId?: string }) => {
      return await apiRequest("POST", "/api/invitations/send", { ...data, courseId });
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado",
        description: "Convite foi enviado com sucesso para o e-mail informado.",
      });
      setShowInviteDialog(false);
      setInviteEmail("");
      setSearchEmail("");
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/pending-invitations`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Não foi possível enviar o convite",
        variant: "destructive",
      });
    },
  });

  const cancelAffiliateInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest("DELETE", `/api/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/pending-invitations`] });
    },
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return await apiRequest("PATCH", `/api/affiliate-applications/${applicationId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação aprovada",
        description: "O usuário foi adicionado como afiliado do produto.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/affiliate-applications`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/affiliates`] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      // Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: [`/api/courses/${courseId}/affiliate-applications`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Não foi possível aprovar a solicitação",
        variant: "destructive",
      });
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return await apiRequest("PATCH", `/api/affiliate-applications/${applicationId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de afiliação foi rejeitada.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/affiliate-applications`] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      // Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: [`/api/courses/${courseId}/affiliate-applications`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message || "Não foi possível rejeitar a solicitação",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-green-600" />
            Gerenciar Afiliados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search-affiliate-email">Buscar usuário por e-mail</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="search-affiliate-email"
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="flex-1"
              />
              <Button
                onClick={() => searchUserMutation.mutate(searchEmail)}
                disabled={!searchEmail || searchUserMutation.isPending}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedUser && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedUser.fullName}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="commission">Comissão (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      min="1"
                      max="50"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => addAffiliateMutation.mutate({
                      courseId: courseId!,
                      userId: selectedUser.id,
                      commission: parseFloat(commission),
                    })}
                    disabled={addAffiliateMutation.isPending}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Afiliado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedUser && searchEmail && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setInviteEmail(searchEmail);
                  setShowInviteDialog(true);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar convite para {searchEmail}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {Array.isArray(affiliates) && affiliates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Afiliados Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {affiliates.map((affiliate: any) => (
                <div key={affiliate.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{affiliate.user?.fullName || 'Nome não disponível'}</p>
                    <p className="text-sm text-gray-600">{affiliate.user?.email || 'Email não disponível'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {affiliate.commission}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAffiliateMutation.mutate(affiliate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Array.isArray(affiliateApplications) && affiliateApplications.filter(app => app.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Afiliados Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {affiliateApplications.filter(app => app.status === 'pending').map((application: any) => (
                <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div>
                    <p className="font-medium">{application.applicantName}</p>
                    <p className="text-sm text-gray-600">{application.applicantEmail}</p>
                    <p className="text-xs text-blue-600">
                      Solicitado em {new Date(application.appliedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveApplicationMutation.mutate(application.id)}
                      disabled={approveApplicationMutation.isPending || rejectApplicationMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectApplicationMutation.mutate(application.id)}
                      disabled={approveApplicationMutation.isPending || rejectApplicationMutation.isPending}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Array.isArray(pendingInvitations) && pendingInvitations.filter(inv => inv.type === 'affiliate').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Mail className="h-5 w-5 mr-2 text-orange-600" />
              Afiliados Aguardando Convite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations
                .filter(inv => inv.type === 'affiliate')
                .map((invitation: any) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">{invitation.recipientEmail}</p>
                    <p className="text-sm text-gray-600">
                      {invitation.commission}% de comissão • 
                      Enviado em {new Date(invitation.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-orange-600">
                      Expira em {new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelAffiliateInvitationMutation.mutate(invitation.id)}
                    disabled={cancelAffiliateInvitationMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Convite para Afiliado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="affiliate-invite-email">E-mail do convidado</Label>
              <Input
                id="affiliate-invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="affiliate-invite-commission">Comissão (%)</Label>
              <Input
                id="affiliate-invite-commission"
                type="number"
                min="1"
                max="50"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => sendAffiliateInviteMutation.mutate({
                  email: inviteEmail,
                  type: 'affiliate',
                  commission: parseFloat(commission)
                })}
                disabled={sendAffiliateInviteMutation.isPending || !inviteEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreateCourse() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { kycStatus, hasSubmittedDocuments, needsKycSubmission } = useKyc();
  const [activeTab, setActiveTab] = useState("produto");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // Get course ID from URL for editing using useRoute
  const [match, params] = useRoute("/courses/:id/edit");
  const courseId = params?.id;
  const isEditing = !!courseId;

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      image: "",
      categoryId: "",
      refundPeriod: "30",
      allowsAffiliates: false,
      defaultAffiliateCommission: "0",
    },
  });

  // Fetch current course data for editing
  const { data: currentCourse, isLoading: loadingCourse } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: isEditing && !!courseId,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Load course data into form when editing
  useEffect(() => {
    if (currentCourse && isEditing && !loadingCourse) {
      // Handle both array and object responses from API
      const course = Array.isArray(currentCourse) ? currentCourse[0] : currentCourse;
      console.log("Loading course data:", course);
      
      if (course) {
        // Find matching category ID based on category name
        let categoryId = "";
        if (course.category && Array.isArray(categories)) {
          const matchedCategory = categories.find((cat: any) => cat.name === course.category);
          categoryId = matchedCategory ? matchedCategory.id.toString() : "";
        }
        
        form.reset({
          title: course.title || "",
          description: course.description || "",
          price: course.price?.toString() || "",
          image: course.thumbnailUrl || course.image || "",
          categoryId: categoryId,
          refundPeriod: course.refundPeriod?.toString() || "30",
          allowsAffiliates: course.allowsAffiliates || false,
          defaultAffiliateCommission: course.defaultAffiliateCommission?.toString() || "0",
        });
        
        // Set the category value if it exists
        if (categoryId) {
          form.setValue("categoryId", categoryId);
        }
      }
    }
  }, [currentCourse, isEditing, loadingCourse, form, categories]);

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseForm) => {
      const endpoint = isEditing ? `/api/courses/${courseId}` : "/api/courses";
      const method = isEditing ? "PATCH" : "POST";
      
      return await apiRequest(method, endpoint, {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        thumbnailUrl: data.image || "",
        salesPageContent: "",
        category: data.categoryId || "",
        refundPeriod: parseInt(data.refundPeriod),
        allowsAffiliates: data.allowsAffiliates,
        defaultAffiliateCommission: parseFloat(data.defaultAffiliateCommission || "0"),
      });
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Produto atualizado!" : "Produto criado!",
        description: isEditing 
          ? "Seu produto foi atualizado com sucesso." 
          : "Seu produto foi criado e está pronto para venda.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setLocation("/courses");
    },
    onError: (error: Error) => {
      // Check if error is related to KYC approval
      const errorMessage = error.message;
      if (errorMessage.includes("KYC approval required") || errorMessage.includes("requiresKyc")) {
        toast({
          title: "Verificação KYC Necessária",
          description: "Complete sua verificação KYC para criar produtos na plataforma.",
          variant: "destructive",
        });
        // Redirect to KYC verification page
        setLocation("/kyc-verification");
      } else {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: CourseForm) => {
    createCourseMutation.mutate(data);
  };

  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/categories", { name });
    },
    onSuccess: (newCategory: any) => {
      toast({
        title: "Categoria criada!",
        description: "Nova categoria adicionada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.setValue("categoryId", newCategory.id.toString());
      setShowCategoryDialog(false);
      setNewCategoryName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a categoria.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = () => {
    if (newCategoryName.trim().length < 2) {
      toast({
        title: "Erro",
        description: "Nome da categoria deve ter pelo menos 2 caracteres.",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  const generateRandomPrice = () => {
    const prices = [97, 147, 197, 247, 297, 347, 397, 447, 497];
    return prices[Math.floor(Math.random() * prices.length)];
  };

  const tabs = isEditing ? [
    { id: "produto", label: "Produto" },
    { id: "ofertas", label: "Ofertas" },
    { id: "order-bumps", label: "Order Bumps" },
    { id: "co-produtor", label: "Co-Produtor" },
    { id: "afiliados", label: "Afiliados" },
  ] : [
    { id: "produto", label: "Produto" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 ml-64">
          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/courses")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <h1 className="text-2xl font-bold">
                  {isEditing ? "Editar Produto" : "Criar Novo Produto"}
                </h1>
              </div>

              {/* KYC Warning for non-editing users */}
              {!isEditing && user && (
                <KycWarning 
                  kycStatus={kycStatus} 
                  hasSubmittedDocuments={hasSubmittedDocuments} 
                />
              )}

              <Card>
                <CardHeader className="border-b bg-white">
                  <div className="flex space-x-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? "border-primary-blue text-primary-blue bg-blue-50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {activeTab === "produto" && (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Título do Produto *</Label>
                            <Input
                              id="title"
                              {...form.register("title")}
                              placeholder="Ex: Curso de Marketing Digital"
                              className="mt-1"
                            />
                            {form.formState.errors.title && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.title.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="price">Preço (R$) *</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              min="0"
                              {...form.register("price")}
                              placeholder="197.00"
                              className="mt-1"
                            />
                            {form.formState.errors.price && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.price.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="image">URL da Imagem</Label>
                            <Input
                              id="image"
                              {...form.register("image")}
                              placeholder="https://exemplo.com/imagem.jpg"
                              className="mt-1"
                            />
                            {form.formState.errors.image && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.image.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="category">Categoria *</Label>
                              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="text-xs">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Nova categoria
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Adicionar nova categoria</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div>
                                      <Label htmlFor="newCategoryName">Nome da categoria</Label>
                                      <Input
                                        id="newCategoryName"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Ex: Marketing Digital"
                                        className="mt-1"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleCreateCategory();
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                          setShowCategoryDialog(false);
                                          setNewCategoryName("");
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={handleCreateCategory}
                                        disabled={createCategoryMutation.isPending}
                                      >
                                        {createCategoryMutation.isPending ? "Criando..." : "Criar categoria"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <Select 
                              value={form.watch("categoryId")} 
                              onValueChange={(value) => form.setValue("categoryId", value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(categories) && categories.length > 0 ? (
                                  categories.map((category: Category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-categories" disabled>
                                    Nenhuma categoria encontrada
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.categoryId && (
                              <p className="text-sm text-red-500 mt-1">
                                {form.formState.errors.categoryId.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Descrição *</Label>
                          <Textarea
                            id="description"
                            {...form.register("description")}
                            placeholder="Descreva seu produto em detalhes..."
                            className="mt-1 h-64"
                          />
                          {form.formState.errors.description && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.description.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="refundPeriod">Prazo de Reembolso (dias)</Label>
                          <Select 
                            value={form.watch("refundPeriod")} 
                            onValueChange={(value) => form.setValue("refundPeriod", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione o prazo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 dias</SelectItem>
                              <SelectItem value="15">15 dias</SelectItem>
                              <SelectItem value="30">30 dias</SelectItem>
                              <SelectItem value="60">60 dias</SelectItem>
                              <SelectItem value="90">90 dias</SelectItem>
                            </SelectContent>
                          </Select>
                          {form.formState.errors.refundPeriod && (
                            <p className="text-sm text-red-500 mt-1">
                              {form.formState.errors.refundPeriod.message}
                            </p>
                          )}
                        </div>

                        {/* Affiliate Settings */}
                        <div className="md:col-span-2 border-t pt-6">
                          <h3 className="text-lg font-medium mb-4 flex items-center">
                            <UserPlus className="h-5 w-5 mr-2 text-green-600" />
                            Configurações de Afiliação
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="allowsAffiliates"
                                {...form.register("allowsAffiliates")}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="allowsAffiliates" className="text-sm font-medium">
                                Permitir afiliados para este produto
                              </Label>
                            </div>

                            <div>
                              <Label htmlFor="defaultAffiliateCommission">Comissão padrão para afiliados (%)</Label>
                              <Input
                                id="defaultAffiliateCommission"
                                type="number"
                                min="0"
                                max="50"
                                step="0.01"
                                {...form.register("defaultAffiliateCommission")}
                                placeholder="15.00"
                                className="mt-1"
                                disabled={!form.watch("allowsAffiliates")}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Porcentagem da venda que será paga aos afiliados
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocation("/courses")}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-primary-blue hover:bg-blue-700"
                          disabled={createCourseMutation.isPending}
                        >
                          {createCourseMutation.isPending 
                            ? (isEditing ? "Atualizando..." : "Criando...") 
                            : (isEditing ? "Atualizar Produto" : "Criar Produto")}
                        </Button>
                      </div>
                    </form>
                  )}

                  {activeTab === "ofertas" && (
                    <OfertasTab courseId={courseId} />
                  )}

                  {activeTab === "order-bumps" && (
                    <OrderBumpsTab courseId={courseId} />
                  )}

                  {activeTab === "co-produtor" && (
                    <CoProducerTab courseId={courseId} />
                  )}

                  {activeTab === "afiliados" && (
                    <AffiliateTab courseId={courseId} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}