"use client";

import { useAuth } from "./auth-context";
import { ProfileCompletionModal } from "@/components/profile-completion-modal";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { profileCompletionState } from "@/lib/profile-completion-state";

export default function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profileComplete, missingFields, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();

  // Routes that don't require profile completion
  const exemptRoutes = ["/", "/login", "/signup", "/contact-us", "/premium-subscription", "/basic-subscription"];
  const isExemptRoute = exemptRoutes.includes(pathname) || pathname.startsWith("/auth/");

  useEffect(() => {
    // Only show modal after first payment completion
    const shouldShow = profileCompletionState.shouldShowModal(isAuthenticated, profileComplete);
    if (shouldShow && !isExemptRoute && !isLoading) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, profileComplete, isExemptRoute, isLoading, pathname]);

  // If user should complete profile after first payment, show modal
  if (showModal) {
    return (
      <>
        {children}
        <ProfileCompletionModal
          open={showModal}
          onOpenChange={() => {}} // Prevent closing
          onProfileComplete={() => {
            setShowModal(false);
            profileCompletionState.markModalShown();
          }}
          forceOpen={true}
        />
      </>
    );
  }

  return <>{children}</>;
}