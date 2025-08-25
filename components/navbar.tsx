// components/navbar.tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FiMenu, FiUser, FiLogOut, FiSettings, FiShoppingCart, FiX, FiChevronDown } from "react-icons/fi";
import { useAuth } from "./auth/auth-context";
import { useCart } from "./cart/cart-context";


const NavLinks = [
  {
    title: "Home",
    href: "/",
    sublinks: [],
  },
  {
    title: "Services",
    href: "/#services",
    sublinks: [],
  },
  {
    title: "About Us",
    href: "#",
    sublinks: [],
  },
  {
    title: "Contact Us",
    href: "/contact-us",
    sublinks: [],
  },
];

interface NavLink {
  title: string;
  href: string;
  sublinks: { title: string; href: string; }[];
}

interface NavbarProps {
  variant?: 'default' | 'premium';
}

interface RoundedDrawerNavProps {
  navBackground?: string;
  bodyBackground?: string;
  links?: NavLink[];
  variant?: 'default' | 'premium';
}

export const Navbar = ({ variant = "default" }: NavbarProps) => {
  const bgColor = variant === "premium" ? "bg-[#FFB800]" : "bg-[#001633]";

  return (
    <div className="fixed w-full z-50 px-4 py-4">
      <div className={`${bgColor} rounded-[40px] shadow-lg`}>
        <RoundedDrawerNav
          navBackground="bg-transparent"
          bodyBackground="bg-white"
          links={NavLinks}
          variant={variant}
        />
      </div>
    </div>
  );
};

export const RoundedDrawerNav = ({
  navBackground,
  bodyBackground,
  links = NavLinks,
  variant = "default",
}: RoundedDrawerNavProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { cartItemCount } = useCart();
  
  const textColor = variant === "premium" ? "text-[#333333]" : "text-[#FFFFF0]";
  const buttonBg = variant === "premium" ? "bg-[#382404]" : "bg-white";
  const buttonText = variant === "premium" ? "text-white" : "text-[#001633]";
  const mobileMenuBg = variant === "premium" ? "bg-[#FFB800]" : "bg-[#001633]";

  const handleLogin = () => {
    router.push("/login");
    setMobileNavOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      setMobileNavOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDashboard = () => {
    router.push("/dashboard");
    setUserMenuOpen(false);
    setMobileNavOpen(false);
  };

  const handleSettings = () => {
    router.push("/settings");
    setUserMenuOpen(false);
    setMobileNavOpen(false);
  };

  const handleCartClick = () => {
    router.push("/cart");
    setMobileNavOpen(false);
  };

  return (
    <>
      <nav className="px-2 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              {variant === "premium" ? (
                <>
                  <img 
                    src="/landing-page/rlogodark.png" 
                    alt="RangaOne Logo" 
                    className="h-10 w-auto mix-blend-multiply dark:mix-blend-screen" 
                  />
                  <img 
                    src="/landing-page/namelogodark.png" 
                    alt="RangaOne Name" 
                    className="h-10 w-auto mix-blend-multiply dark:mix-blend-screen" 
                  />
                </>
              ) : (
                <>
                  <img 
                    src="/landing-page/rlogo.png" 
                    alt="RangaOne Logo" 
                    className="h-10 w-auto" 
                  />
                  <img 
                    src="/landing-page/namelogo.png" 
                    alt="RangaOne Name" 
                    className="h-10 w-auto" 
                  />
                </>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link, index) => (
              <div key={index} className="relative">
                {link.sublinks.length > 0 ? (
                  <div
                    onMouseEnter={() => setDropdownOpen(link.title)}
                    onMouseLeave={() => setDropdownOpen(null)}
                    className="relative"
                  >
                    <button
                      className={`${textColor} hover:opacity-75 transition-opacity cursor-pointer flex items-center gap-1`}
                    >
                      {link.title}
                      <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen === link.title ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {dropdownOpen === link.title && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                          {link.sublinks.map((sublink, subIndex) => (
                            <Link
                              key={subIndex}
                              href={sublink.href}
                              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setDropdownOpen(null)}
                            >
                              {sublink.title}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={`${textColor} hover:opacity-75 transition-opacity cursor-pointer`}
                  >
                    {link.title}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Authentication & Cart Section */}
          <div className="flex items-center gap-1">
            {/* Cart Icon - Show for all users */}
            <button
              onClick={handleCartClick}
              className={`relative ${buttonBg} ${buttonText} p-2 rounded-full transition-all hover:scale-105`}
            >
              <FiShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-[#FFFFF0] text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                  {cartItemCount}
                </span>
              )}
            </button>



            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  /* Authenticated User Menu */
                                     <div className="relative hidden md:block">
                     <div className={`${buttonBg} ${buttonText} px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 hover:scale-105`}>
                       <button
                         onClick={handleDashboard}
                         className="flex-1 text-left"
                       >
                         Dashboard
                       </button>
                       <button
                         onClick={() => setUserMenuOpen(!userMenuOpen)}
                         className="flex items-center justify-center"
                       >
                         <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                       </button>
                     </div>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`absolute right-0 mt-3 w-64 ${
                            variant === "premium" 
                              ? "bg-white/95 backdrop-blur-xl border-gray-200/50" 
                              : "bg-white/95 backdrop-blur-xl border-white/10"
                          } rounded-2xl shadow-2xl border overflow-hidden z-50`}
                          style={{
                            boxShadow: variant === "premium" 
                              ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)"
                              : "0 25px 50px -12px rgba(0, 22, 51, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                          }}
                        >
                          {/* User Info Header */}
                          <div className={`px-5 py-4 border-b ${
                            variant === "premium" 
                              ? "border-gray-100/80 bg-gradient-to-br from-gray-50/50 to-white/50" 
                              : "border-white/10 bg-gradient-to-br from-slate-900/20 to-slate-800/10"
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${
                              variant === "premium" 
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-[#FFFFF0]"
                                  : "bg-gradient-to-br from-indigo-500 to-purple-600 text-[#FFFFF0]"
                              }`}>
                                {user.username?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm truncate ${
                                  variant === "premium" ? "text-gray-900" : "text-slate-800"
                                }`}>
                                  Hi, {user.username}
                                </p>
                                <p className={`text-xs truncate ${
                                  variant === "premium" ? "text-gray-500" : "text-slate-600"
                            }`}>
                              {user.email}
                                </p>
                              </div>
                            </div>
                            </div>
                            
                          {/* Menu Items */}
                          <div className="py-2">
                            <button
                              onClick={handleDashboard}
                              className={`w-full px-5 py-3 text-left text-sm font-medium transition-all duration-200 flex items-center gap-3 group ${
                                variant === "premium" 
                                  ? "hover:bg-blue-50/80 text-gray-700 hover:text-blue-700" 
                                  : "hover:bg-slate-100/80 text-slate-700 hover:text-slate-900"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                variant === "premium"
                                  ? "bg-blue-100/50 text-blue-600 group-hover:bg-blue-200/70 group-hover:scale-110"
                                  : "bg-slate-200/50 text-slate-600 group-hover:bg-slate-300/70 group-hover:scale-110"
                              }`}>
                              <FiUser className="w-4 h-4" />
                              </div>
                              <span>View Dashboard</span>
                            </button>
                            
                            <button
                              onClick={handleSettings}
                              className={`w-full px-5 py-3 text-left text-sm font-medium transition-all duration-200 flex items-center gap-3 group ${
                                variant === "premium" 
                                  ? "hover:bg-gray-50/80 text-gray-700 hover:text-gray-900" 
                                  : "hover:bg-slate-100/80 text-slate-700 hover:text-slate-900"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                variant === "premium"
                                  ? "bg-gray-100/50 text-gray-600 group-hover:bg-gray-200/70 group-hover:scale-110"
                                  : "bg-slate-200/50 text-slate-600 group-hover:bg-slate-300/70 group-hover:scale-110"
                              }`}>
                              <FiSettings className="w-4 h-4" />
                              </div>
                              <span>Settings</span>
                            </button>
                          </div>
                            
                          {/* Logout Section */}
                          <div className={`border-t ${
                            variant === "premium" ? "border-gray-100/80" : "border-white/10"
                          } pt-2 pb-2`}>
                            <button
                              onClick={handleLogout}
                              className="w-full px-5 py-3 text-left text-sm font-medium transition-all duration-200 flex items-center gap-3 group hover:bg-red-50/80 text-red-600 hover:text-red-700"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 bg-red-100/50 text-red-500 group-hover:bg-red-200/70 group-hover:scale-110">
                              <FiLogOut className="w-4 h-4" />
                              </div>
                              <span>Logout</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Login Button for Non-authenticated Users */
                  <button
                    onClick={handleLogin}
                    className={`hidden md:block ${buttonBg} ${buttonText} px-6 py-2 rounded-full font-medium transition-all hover:scale-105`}
                  >
                    Login
                  </button>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className={`md:hidden ${textColor} hover:opacity-75 transition-opacity px-4`}
            >
              {mobileNavOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`md:hidden ${mobileMenuBg} rounded-b-[40px] overflow-hidden`}
          >
            <div className="px-6 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              {links.map((link, index) => (
                <div key={index}>
                  {link.sublinks.length > 0 ? (
                    <div>
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === link.title ? null : link.title)}
                        className={`flex items-center justify-between w-full ${textColor} text-lg font-medium hover:opacity-75 transition-opacity`}
                      >
                        {link.title}
                        <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen === link.title ? 'rotate-180' : ''}`} />
                      </button>
                      {dropdownOpen === link.title && (
                        <div className="ml-4 mt-2 space-y-2">
                          {link.sublinks.map((sublink, subIndex) => (
                            <Link
                              key={subIndex}
                              href={sublink.href}
                              onClick={() => setMobileNavOpen(false)}
                              className={`block ${textColor} text-base hover:opacity-75 transition-opacity`}
                            >
                              {sublink.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`block ${textColor} text-lg font-medium hover:opacity-75 transition-opacity`}
                    >
                      {link.title}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile User Menu */}
              {isAuthenticated && user ? (
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className={`${textColor} text-sm`}>
                    Hi, {user.username}
                  </div>
                  <button
                    onClick={handleDashboard}
                    className={`block w-full text-left ${textColor} hover:opacity-75 transition-opacity`}
                  >
                    View Dashboard
                  </button>
                  <button
                    onClick={handleSettings}
                    className={`block w-full text-left ${textColor} hover:opacity-75 transition-opacity`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-red-400 hover:text-red-300 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className={`block w-full ${buttonBg} ${buttonText} text-center px-6 py-2 rounded-full font-medium transition-all hover:opacity-90`}
                >
                  Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};