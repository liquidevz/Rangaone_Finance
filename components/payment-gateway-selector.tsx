"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { usePaymentGateways, PaymentGateway } from '@/hooks/use-payment-gateways';
import { cn } from '@/lib/utils';

interface PaymentGatewaySelectorProps {
  selectedGateway: string | null;
  onSelect: (gatewayId: string) => void;
  className?: string;
  showTitle?: boolean;
  isEmandate?: boolean;
}

export function PaymentGatewaySelector({
  selectedGateway,
  onSelect,
  className,
  showTitle = true,
  isEmandate = false,
}: PaymentGatewaySelectorProps) {
  const { 
    gateways, 
    loading, 
    error, 
    defaultGateway, 
    hasMultipleGateways,
    hasSingleGateway,
    supportsEmandate
  } = usePaymentGateways();

  // Auto-select if only one gateway is available
  useEffect(() => {
    if (!loading && gateways.length > 0 && !selectedGateway) {
      if (gateways.length === 1) {
        // Only one gateway, auto-select it
        onSelect(gateways[0].id);
      } else if (defaultGateway) {
        // Multiple gateways, select the default
        onSelect(defaultGateway);
      }
    }
  }, [gateways, loading, defaultGateway, selectedGateway, onSelect]);

  // Filter gateways based on emandate support if needed
  const filteredGateways = isEmandate 
    ? gateways.filter(g => supportsEmandate(g.id))
    : gateways;

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading payment methods...</span>
      </div>
    );
  }

  if (error && gateways.length === 0) {
    return (
      <div className={cn("text-center py-4 text-sm text-destructive", className)}>
        {error}
      </div>
    );
  }

  if (filteredGateways.length === 0) {
    return (
      <div className={cn("text-center py-4 text-sm text-muted-foreground", className)}>
        No payment methods available
      </div>
    );
  }

  // If only one gateway, don't show selector (auto-selected)
  if (filteredGateways.length === 1) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showTitle && (
        <h3 className="text-sm font-medium text-foreground">Select Payment Method</h3>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredGateways.map((gateway) => (
          <GatewayCard
            key={gateway.id}
            gateway={gateway}
            isSelected={selectedGateway === gateway.id}
            onClick={() => onSelect(gateway.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface GatewayCardProps {
  gateway: PaymentGateway;
  isSelected: boolean;
  onClick: () => void;
}

function GatewayCard({ gateway, isSelected, onClick }: GatewayCardProps) {
  const [imgError, setImgError] = useState(false);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/50 bg-background"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Gateway Logo */}
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {gateway.logo && !imgError ? (
            <img 
              src={gateway.logo} 
              alt={gateway.name} 
              className="w-8 h-8 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        {/* Gateway Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground">{gateway.name}</h4>
          <p className="text-xs text-muted-foreground truncate">{gateway.description}</p>
        </div>
      </div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Modal version of the selector for post-eSign selection
interface PaymentGatewaySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gatewayId: string) => void;
  title?: string;
  description?: string;
  isEmandate?: boolean;
}

export function PaymentGatewaySelectorModal({
  isOpen,
  onClose,
  onSelect,
  title = "Choose Payment Method",
  description = "Select your preferred payment gateway to complete the transaction",
  isEmandate = false,
}: PaymentGatewaySelectorModalProps) {
  const { 
    gateways, 
    loading, 
    hasMultipleGateways,
    defaultGateway,
    supportsEmandate
  } = usePaymentGateways();

  // Filter gateways based on emandate support if needed
  const filteredGateways = isEmandate 
    ? gateways.filter(g => supportsEmandate(g.id))
    : gateways;

  // Auto-select if only one gateway
  useEffect(() => {
    if (!loading && filteredGateways.length === 1 && isOpen) {
      onSelect(filteredGateways[0].id);
      onClose();
    }
  }, [filteredGateways, loading, isOpen, onSelect, onClose]);

  const handleSelect = (gatewayId: string) => {
    onSelect(gatewayId);
    onClose();
  };

  if (!isOpen) return null;

  // If only one gateway, don't show modal (auto-handled)
  if (!loading && filteredGateways.length === 1) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGateways.map((gateway) => (
              <ModalGatewayButton
                key={gateway.id}
                gateway={gateway}
                onClick={() => handleSelect(gateway.id)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Separate component for modal gateway buttons to handle image state
function ModalGatewayButton({ gateway, onClick }: { gateway: PaymentGateway; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center p-4 rounded-lg border-2 border-border hover:border-primary bg-background transition-all"
    >
      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden mr-4">
        {gateway.logo && !imgError ? (
          <img 
            src={gateway.logo} 
            alt={gateway.name} 
            className="w-10 h-10 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <CreditCard className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 text-left">
        <h4 className="text-base font-medium text-foreground">{gateway.name}</h4>
        <p className="text-sm text-muted-foreground">{gateway.description}</p>
      </div>
    </motion.button>
  );
}
