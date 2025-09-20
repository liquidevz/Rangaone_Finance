import { NextRequest, NextResponse } from "next/server";

// Mock cart data structure (same as main cart route)
interface CartItem {
  itemType: "Portfolio";
  portfolio: {
    name: string;
    description: string;
    cashBalance: number;
    currentValue: number;
    holdingsValueAtMarket: number;
    totalUnrealizedPnL: number;
    totalUnrealizedPnLPercent: number;
    subscriptionFee: Array<{
      type: string;
      price: number;
    }>;
    emandateSubriptionFees: Array<{
      type: string;
      price: number;
    }>;
    minInvestment: number;
    durationMonths: number;
    PortfolioCategory: string;
    timeHorizon: string;
    rebalancing: string;
    lastRebalanceDate: string;
    nextRebalanceDate: string;
    monthlyContribution: number;
    index: string;
    details: string;
    monthlyGains: number;
    CAGRSinceInception: number;
    oneYearGains: number;
    compareWith: string;
    holdings: Array<any>;
    saleHistory: Array<any>;
    downloadLinks: Array<any>;
    youTubeLinks: Array<any>;
    holdingsValue: number;
    _id: string;
    createdAt: string;
  };
  bundle: {
    _id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    quarterlyPrice: number;
    yearlyPrice: number;
  };
  quantity: number;
  addedAt: string;
}

interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// Mock cart storage (use database in production)
let userCarts: { [userId: string]: Cart } = {};

function getUserIdFromToken(authHeader: string): string {
  // In production, decode JWT token to get user ID
  // For now, return a mock user ID
  return "mock-user-id";
}

function createEmptyCart(userId: string): Cart {
  const now = new Date().toISOString();
  return {
    _id: `cart-${userId}-${Date.now()}`,
    user: userId,
    items: [],
    createdAt: now,
    updatedAt: now
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          status: "error",
          message: "Authentication token required",
          error: "Unauthorized access"
        },
        { status: 401 }
      );
    }

    const userId = getUserIdFromToken(authHeader);
    const { portfolioId } = params;

    // Check if cart exists
    if (!userCarts[userId]) {
      return NextResponse.json(
        { error: "Cart or item not found" },
        { status: 404 }
      );
    }

    const cart = userCarts[userId];
    
    // Find the item to remove
    const itemIndex = cart.items.findIndex(
      item => item.portfolio._id === portfolioId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Cart or item not found" },
        { status: 404 }
      );
    }

    // Remove the item from cart
    cart.items.splice(itemIndex, 1);
    cart.updatedAt = new Date().toISOString();
    
    userCarts[userId] = cart;

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}