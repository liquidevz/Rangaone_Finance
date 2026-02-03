"use client";

import { cn } from "@/lib/utils";
import {
  BarChart2,
  ChevronDown,
  ChevronLeft,
  Home,
  LineChart,
  Play,
  Settings,
  Users,
  Video,
  Briefcase,
  X,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navigationItems = [
  {
    title: "Overview",
    icon: <BarChart2 className="h-4 w-4" />,
    items: [
      {
        label: "Dashboard",
        icon: <Home className="h-6 w-6" />,
        href: "/dashboard",
        badge: null,
      },
      {
        label: "RangaOne Wealth",
        icon: <Briefcase className="h-6 w-6" />,
        href: "/rangaone-wealth",
        badge: null,
      },
      {
        label: "Model Portfolios",
        icon: <LineChart className="h-6 w-6" />,
        href: "/model-portfolios",
        badge: null,
      },
      {
        label: "Investment Calculator",
        icon: <Calculator className="h-6 w-6" />,
        href: "/investment-calculator",
        badge: null,
      },
    ],
  },
  {
    title: "Resources",
    icon: <Play className="h-4 w-4" />,
    items: [
      {
        label: "User Portfolio",
        icon: <Briefcase className="h-6 w-6" />,
        href: "/resources/user-portfolio",
        badge: null,
      },
      {
        label: "Videos For You",
        icon: <Video className="h-6 w-6" />,
        href: "/videos-for-you",
        badge: null,
      },
      {
        label: "Contact Support",
        icon: <Users className="h-6 w-6" />,
        href: "/dashboard/contact-us",
        badge: null,
      },

    ],
  },
];

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Overview: true,
    Resources: true,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (section: string) => {
    if (isCollapsed) return;
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-white backdrop-blur-md z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        data-tour="sidebar"
        className={cn(
          "bg-gradient-to-br from-slate-50 via-white to-blue-50/40",
          "border-r border-gray-200/80 shadow-2xl backdrop-blur-xl",
          "transition-all duration-300 ease-out flex flex-col",
          "fixed inset-y-0 left-0 z-50 lg:relative lg:z-10",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-80 lg:w-auto",
          isCollapsed ? "lg:w-24" : "lg:w-72",
          "max-w-xs"
        )}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200/60 bg-white/90 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between px-4 h-full">
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed ? "lg:justify-center lg:w-full" : "gap-2"
            )}>
              <img
                src="/landing-page/rlogodark.png"
                alt="RangaOne Logo"
                className="h-10 w-auto"
              />
              {!isCollapsed && (
                <img
                  src="/landing-page/namelogodark.png"
                  alt="RangaOne Name"
                  className="h-10 w-auto"
                />
              )}
            </div>

            {/* Desktop collapse toggle
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={cn(
                  "hidden lg:flex p-2 rounded-xl hover:bg-gray-100/80 transition-colors",
                  "ring-1 ring-gray-200/50 hover:ring-gray-300/50 backdrop-blur-sm",
                  isCollapsed && "rotate-180"
                )}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </button>
            )} */}

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100/80 transition-colors ring-1 ring-gray-200/50"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          "p-4 space-y-6"
        )}>
          {navigationItems.map((section) => (
            <div key={section.title} className="space-y-2">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "flex items-center justify-between w-full text-xs font-semibold",
                  "text-gray-600 uppercase tracking-wider transition-all duration-200",
                  "hover:text-gray-800",
                  "px-3 py-2.5 rounded-xl hover:bg-white/60",
                  "border border-transparent hover:border-gray-200/60",
                  "group",
                  isCollapsed ? "lg:hidden" : ""
                )}
                disabled={isCollapsed}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    {section.icon}
                  </span>
                  <span>{section.title}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-gray-400 transition-all duration-200",
                    "group-hover:text-gray-600",
                    expandedSections[section.title] && "rotate-180"
                  )}
                />
              </button>

              {/* Navigation Items */}
              <div className={cn(
                "space-y-1 transition-all duration-200",
                isCollapsed ? "lg:block" : expandedSections[section.title] ? "block" : "hidden"
              )}>
                {section.items.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "flex items-center justify-between w-full text-sm rounded-xl",
                      "transition-all duration-200 group relative overflow-hidden",
                      isActive(item.href)
                        ? [
                          "bg-[#131859] text-white font-medium",
                          "shadow-lg shadow-blue-500/30 transform translate-y-0",
                          "ring-2 ring-blue-200/50",
                          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:to-white/10"
                        ]
                        : [
                          "text-gray-700 hover:bg-white/90 hover:shadow-md hover:transform hover:translate-y-[-1px]",
                          "border border-transparent hover:border-gray-200/60",
                          "backdrop-blur-sm"
                        ],
                      isCollapsed ? "lg:w-16 lg:h-16 lg:p-0 lg:justify-center" : "px-4 py-3"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={cn(
                      "flex items-center relative z-10 transition-all duration-200",
                      isCollapsed ? "lg:justify-center" : "space-x-3"
                    )}>
                      <span
                        className={cn(
                          "transition-all duration-200",
                          isActive(item.href)
                            ? "text-white drop-shadow-sm"
                            : "text-gray-600 group-hover:text-gray-800",
                          isCollapsed && "lg:text-xl"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className={cn(
                        "font-medium",
                        isCollapsed ? "lg:hidden" : "block"
                      )}>
                        {item.label}
                      </span>
                    </div>

                    {/* Active indicator */}
                    {isActive(item.href) && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 bg-white rounded-l-full opacity-90",
                        isCollapsed ? "right-0 w-1 h-12" : "right-0 w-1 h-10"
                      )} />
                    )}

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-indigo-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Settings - Standalone */}
          <div className="pt-4 border-t border-gray-200/60">
            <button
              onClick={() => handleNavClick("/settings")}
              className={cn(
                "flex items-center justify-between w-full text-sm rounded-xl",
                "transition-all duration-200 group relative overflow-hidden",
                isActive("/settings")
                  ? [
                    "bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium",
                    "shadow-lg shadow-gray-500/30 ring-2 ring-gray-200/50",
                  ]
                  : [
                    "text-gray-700 hover:bg-white/90 hover:shadow-md hover:transform hover:translate-y-[-1px]",
                    "border border-transparent hover:border-gray-200/60",
                    "backdrop-blur-sm"
                  ],
                isCollapsed ? "lg:w-16 lg:h-16 lg:p-0 lg:justify-center" : "px-4 py-3"
              )}
              title={isCollapsed ? "Settings" : undefined}
            >
              <div className={cn(
                "flex items-center transition-all duration-200",
                isCollapsed ? "lg:justify-center" : "space-x-3"
              )}>
                <span
                  className={cn(
                    "transition-colors duration-200",
                    isActive("/settings") ? "text-white" : "text-gray-600 group-hover:text-gray-800",
                    isCollapsed && "lg:text-xl"
                  )}
                >
                  <Settings className="h-6 w-6" />
                </span>
                <span className={cn(
                  "font-medium",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  Settings
                </span>
              </div>

              {/* Active indicator */}
              {isActive("/settings") && (
                <div className={cn(
                  "absolute top-1/2 -translate-y-1/2 bg-white rounded-l-full opacity-90",
                  isCollapsed ? "right-0 w-1 h-12" : "right-0 w-1 h-10"
                )} />
              )}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}