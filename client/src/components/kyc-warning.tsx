import { AlertTriangle, FileText, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface KycWarningProps {
  kycStatus: string;
  hasSubmittedDocuments?: boolean;
  showOnPages?: string[];
}

export function KycWarning({ kycStatus, hasSubmittedDocuments = false, showOnPages = [] }: KycWarningProps) {
  if (kycStatus === 'approved') return null;

  const getStatusInfo = () => {
    if (kycStatus === 'pending' && hasSubmittedDocuments) {
      return {
        icon: Clock,
        title: "Documentos KYC em Análise",
        description: "Seus documentos estão sendo analisados pela nossa equipe. Você poderá criar e vender produtos assim que a verificação for aprovada.",
        bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        titleColor: "text-blue-900",
        descColor: "text-blue-800",
        extraInfo: "⏱️ Tempo médio de análise: 24-48 horas",
        action: null
      };
    }
    
    if (kycStatus === 'rejected') {
      return {
        icon: AlertTriangle,
        title: "Documentos KYC Rejeitados",
        description: "Seus documentos foram rejeitados. Verifique os motivos e envie novos documentos para continuar usando a plataforma.",
        bgColor: "bg-gradient-to-r from-red-50 to-pink-50",
        borderColor: "border-red-200",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        descColor: "text-red-800",
        extraInfo: null,
        action: (
          <Button asChild variant="destructive">
            <Link href="/settings">
              <FileText className="mr-2 h-4 w-4" />
              Reenviar Documentos
            </Link>
          </Button>
        )
      };
    }
    
    return {
      icon: Shield,
      title: "Verificação KYC Necessária",
      description: "Para garantir a segurança da plataforma, você precisa enviar seus documentos para verificação KYC antes de criar e vender produtos.",
      bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      titleColor: "text-amber-900",
      descColor: "text-amber-800",
      extraInfo: null,
      action: (
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link href="/settings">
            <FileText className="mr-2 h-4 w-4" />
            Enviar Documentos KYC
          </Link>
        </Button>
      )
    };
  };

  const { 
    icon: Icon, 
    title, 
    description, 
    bgColor, 
    borderColor, 
    iconBg, 
    iconColor, 
    titleColor, 
    descColor, 
    extraInfo, 
    action 
  } = getStatusInfo();

  return (
    <Card className={`mb-6 ${borderColor} ${bgColor}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${titleColor} mb-2`}>
              {title}
            </h3>
            <p className={`${descColor} ${action ? 'mb-4' : ''}`}>
              {description}
            </p>
            {extraInfo && (
              <div className={`mt-3 text-sm ${descColor.replace('800', '700')}`}>
                {extraInfo}
              </div>
            )}
            {action && action}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}