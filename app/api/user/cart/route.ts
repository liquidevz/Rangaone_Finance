import { NextRequest, NextResponse } from "next/server";

// Mock cart data structure
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

export async function DELETE(request: NextRequest) {
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
    
    // Check if cart exists
    if (!userCarts[userId]) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    // Clear the cart by creating a new empty cart
    const clearedCart = createEmptyCart(userId);
    userCarts[userId] = clearedCart;

    return NextResponse.json(clearedCart, { status: 200 });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
    
    // Get or create cart
    if (!userCarts[userId]) {
      userCarts[userId] = createEmptyCart(userId);
    }

    return NextResponse.json(userCarts[userId], { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    
    if (!body.portfolioId) {
      return NextResponse.json(
        { error: "Portfolio ID is required" },
        { status: 400 }
      );
    }

    // Get or create cart
    if (!userCarts[userId]) {
      userCarts[userId] = createEmptyCart(userId);
    }

    const cart = userCarts[userId];
    const quantity = body.quantity || 1;

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      item => item.portfolio._id === body.portfolioId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item (mock portfolio data)
      const newItem: CartItem = {
        itemType: "Portfolio",
        portfolio: {
          name: "Tech Growth Portfolio",
          description: "Technology focused growth stocks",
          cashBalance: 1200.5,
          currentValue: 10500.75,
          holdingsValueAtMarket: 9300.25,
          totalUnrealizedPnL: 1500.5,
          totalUnrealizedPnLPercent: 18.75,
          subscriptionFee: [
            { type: "monthly", price: 19.99 },
            { type: "yearly", price: 199.99 }
          ],
          emandateSubriptionFees: [
            { type: "monthly", price: 29.99 },
            { type: "yearly", price: 299.99 }
          ],
          minInvestment: 5000,
          durationMonths: 12,
          PortfolioCategory: "Premium",
          timeHorizon: "5 years",
          rebalancing: "Quarterly",
          lastRebalanceDate: "2026-02-05T00:00:00.000Z",
          nextRebalanceDate: "2026-05-05T00:00:00.000Z",
          monthlyContribution: 500,
          index: "Nifty 50",
          details: "Focused on high-growth technology stocks",
          monthlyGains: 1.8,
          CAGRSinceInception: 15.2,
          oneYearGains: 22.5,
          compareWith: "NIFTY50",
          holdings: [],
          saleHistory: [],
          downloadLinks: [],
          youTubeLinks: [],
          holdingsValue: 9300.25,
          _id: body.portfolioId,
          createdAt: new Date().toISOString()
        },
        bundle: {
          _id: "bundle-1",
          name: "Premium Bundle",
          description: "Premium investment bundle",
          monthlyPrice: 0,
          quarterlyPrice: 0,
          yearlyPrice: 0
        },
        quantity: quantity,
        addedAt: new Date().toISOString()
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date().toISOString();
    userCarts[userId] = cart;

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}