"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, Search, X, PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";

import { GlobalSearch } from "@/components/global-search";
import { DemoTour } from "@/components/demo-tour";

export default function DashboardLayout({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    
    // Load sidebar state from localStorage
    const savedCollapsedState = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsedState !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsedState));
    }
    
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      // On desktop, sidebar should be open by default
      // On mobile, it should be closed by default
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, [isMounted]);



  useEffect(() => {
    if (!isMounted) return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    if (typeof document !== "undefined") {
      if (sidebarOpen && window.innerWidth < 1024) {
        document.body.classList.add("sidebar-open");
      } else {
        document.body.classList.remove("sidebar-open");
      }
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("sidebar-open");
      }
    };
  }, [sidebarOpen, isMounted]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsedState));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Desktop Layout */}
      <div className="flex h-screen">
        {/* Sidebar - Full Height on Desktop */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header - Positioned to the right of sidebar on desktop */}
          <header className="sticky top-0 z-20 w-full border-b border-gray-200/80 bg-white/90 backdrop-blur-xl shadow-sm">
            <div className="flex h-16 items-center px-4">
              {/* Back to Home Button - Positioned first for left alignment */}
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex rounded-xl p-2 gap-2 text-gray-500 hover:bg-gray-100/80 hover:text-gray-700 transition-all duration-200 ring-1 ring-gray-200/50 hover:ring-gray-300/50"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeft className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  sidebarCollapsed && "rotate-180"
                )} />
              </button>

              <button
                onClick={toggleSidebar}
                className="rounded-xl p-2 px-1 text-gray-500 hover:bg-gray-100/80 hover:text-gray-700 transition-all duration-200 lg:hidden ring-1 ring-gray-200/50 hover:ring-gray-300/50"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-all duration-200 ring-1 ring-gray-200/50 hover:ring-blue-300/50 ml-4"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Back to Home</span>
              </Link>

              {/* Demo Tour Button */}
              <button
                onClick={() => setShowTour(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ml-2 border-0"
                title="Take a guided tour of all features"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Demo Tour</span>
              </button>

              {/* Logo beside Back to Home button - Mobile only */}
              <div className="flex items-center px-7 ml-3 lg:hidden">
                <img 
                  src="/landing-page/namelogodark.png" 
                  alt="RangaOne Name" 
                  className="h-8 w-auto" 
                />
              </div>

              {/* Mobile menu button */}
              

              {/* Desktop sidebar toggle */}
             

              {/* Logo for when sidebar is collapsed - Desktop only */}
              <div className={cn(
                "hidden lg:flex items-center gap-2 transition-all duration-300",
                "opacity-0 pointer-events-none",
                sidebarCollapsed && "opacity-100 pointer-events-auto"
              )}>
                <img 
                  src="/landing-page/rlogo.png" 
                  alt="RangaOne Logo" 
                  className="h-8 w-auto" 
                />
                <img 
                  src="/landing-page/namelogo.png" 
                  alt="RangaOne Name" 
                  className="h-8 w-auto" 
                />
              </div>

              {/* Search */}
              <div className="hidden md:flex flex-1 items-center gap-4 max-w-3xl">
                <GlobalSearch />
              </div>
              
              {/* Mobile spacer */}
              <div className="flex-1 md:hidden"></div>

              {/* Actions */}
              <div className="flex items-center gap-2">


                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-xl p-2 text-gray-700 hover:bg-gray-100/80 transition-all duration-200 ring-1 ring-gray-200/50 hover:ring-gray-300/50"
                  >
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <span className="text-[#FFFFF0] font-semibold text-sm">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      showUserMenu && "rotate-180"
                    )} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200/80 bg-white/95 backdrop-blur-xl py-1 shadow-xl">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <div className="font-medium text-gray-900">{user?.username || 'User'}</div>
                        <div className="text-sm text-gray-500">{user?.email || 'user@example.com'}</div>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors duration-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Settings
                        </Link>
                        {isAuthenticated ? (
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50/80 transition-colors duration-200"
                          >
                            Sign out
                          </button>
                        ) : (
                          <Link
                            href="/login"
                            className="flex w-full items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50/80 transition-colors duration-200"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Sign in
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Demo Tour Component */}
      <DemoTour 
        isOpen={showTour} 
        onClose={() => setShowTour(false)} 
      />
    </div>
  );
}