import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const registerSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("register");

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo à plataforma IYUUP",
        });
        window.location.href = "/dashboard";
      } else {
        toast({
          title: "Erro no cadastro",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      let errorMessage = "Erro desconhecido";
      
      if (error.message.includes("already exists")) {
        errorMessage = "Este email já está cadastrado";
      } else if (error.message.includes("email")) {
        errorMessage = "Email inválido";
      } else if (error.message.includes("password")) {
        errorMessage = "Senha deve ter pelo menos 6 caracteres";
      } else if (error.message.includes("validation")) {
        errorMessage = "Dados inválidos, verifique os campos";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta!",
        });
        window.location.href = "/dashboard";
      } else {
        toast({
          title: "Erro no login",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      let errorMessage = "Erro desconhecido";
      
      if (error.message.includes("Invalid credentials")) {
        errorMessage = "Email ou senha incorretos";
      } else if (error.message.includes("User not found")) {
        errorMessage = "Usuário não encontrado";
      } else if (error.message.includes("password")) {
        errorMessage = "Senha incorreta";
      } else if (error.message.includes("email")) {
        errorMessage = "Email inválido";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-blue to-dark-blue p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">IYUUP</h1>
          <p className="text-blue-100">Crie e venda seus cursos online</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold text-gray-800">
              {activeTab === "register" ? "Comece a vender hoje" : "Faça seu login"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
                <TabsTrigger value="login">Entrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      {...registerForm.register("fullName")}
                      placeholder="Seu nome completo"
                      className="mt-1"
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerForm.register("email")}
                      placeholder="seu@email.com"
                      className="mt-1"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...registerForm.register("phone")}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      {...registerForm.register("password")}
                      placeholder="Mínimo 8 caracteres"
                      className="mt-1"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-secondary-orange hover:bg-orange-600 text-white font-semibold"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Criando..." : "Criar Minha Plataforma"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail">E-mail</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      {...loginForm.register("email")}
                      placeholder="seu@email.com"
                      className="mt-1"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="loginPassword">Senha</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      {...loginForm.register("password")}
                      placeholder="Sua senha"
                      className="mt-1"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary-blue hover:bg-blue-700 text-white font-semibold"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-sm text-gray-600 text-center mt-6">
              Ao se cadastrar, você concorda com nossos termos de uso
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
