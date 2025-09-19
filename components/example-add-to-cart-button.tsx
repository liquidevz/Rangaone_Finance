"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { ShoppingCart } from "lucide-react";

interface ExampleAddToCartButtonProps {
  portfolioId: string;
  portfolioData?: {
    name: string;
    subscriptionFee: Array<{
      type: "monthly" | "quarterly" | "yearly";
      price: number;
    }>;
  };
}

export const ExampleAddToCartButton = ({ 
  portfolioId, 
  portfolioData 
}: ExampleAddToCartButtonProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    try {
      await addToCart(portfolioId, 1, portfolioData);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  return (
    <Button 
      onClick={handleAddToCart}
      className="flex items-center gap-2"
    >
      <ShoppingCart className="w-4 h-4" />
      Add to Cart
    </Button>
  );
};