import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export function useKyc() {
  const { user } = useAuth();

  const { data: kycDocuments = [] } = useQuery({
    queryKey: ["/api/kyc/documents"],
    enabled: !!user,
  });

  const hasSubmittedDocuments = Array.isArray(kycDocuments) && kycDocuments.length > 0;
  const kycStatus = user?.kycStatus || 'pending';
  const isKycApproved = kycStatus === 'approved';

  return {
    kycStatus,
    hasSubmittedDocuments,
    isKycApproved,
    canCreateProducts: isKycApproved,
    needsKycSubmission: !hasSubmittedDocuments && kycStatus !== 'approved',
    needsKycApproval: hasSubmittedDocuments && kycStatus === 'pending',
  };
}