

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserModel } from "@/api/entities";
import {
  Plane,
  LayoutDashboard,
  FileText,
  BarChart3,
  User,
  Settings,
  Upload,
  HelpCircle,
  LogOut,
  Target,
  FileLock,
  Users,
  Mail,
  Download,
  Menu as MenuIcon,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// PWA Install Button Component - adapted for different contexts
function PWAInstallButton({ as: ComponentType = 'button', className, ...props }) {
  // PWA functionality disabled: render nothing
  return null;
}

const mainNavigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "LogBook", url: createPageUrl("FlightLog"), icon: FileText },
  { title: "Reports", url: createPageUrl("Reports"), icon: BarChart3 },
  { title: "Aircraft", url: createPageUrl("Aircraft"), icon: Plane },
  { title: "Upload Flights", url: createPageUrl("UploadFlights"), icon: Upload },
  { title: "Requirements", url: createPageUrl("Requirements"), icon: Target },
  { title: "Flight Groups", url: createPageUrl("FlightGroup"), icon: Users },
  { title: "Instructions", url: createPageUrl("Instructions"), icon: HelpCircle }
];

const userMenuItems = [
    { title: "Profile", url: createPageUrl("Profile"), icon: User },
    { title: "Contact Us", url: createPageUrl("ContactUs"), icon: Mail },
    { title: "Privacy Policy", url: createPageUrl("PrivacyPolicy"), icon: FileLock },
];

const UserMenu = () => {
    const handleLogout = async () => {
        try {
            await UserModel.logout();
            window.location.href = window.location.origin + createPageUrl("Home");
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = window.location.origin + createPageUrl("Home");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User Menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenuItems.map(item => (
                    <DropdownMenuItem key={item.title} asChild>
                        <Link to={item.url} className="flex items-center gap-2 cursor-pointer">
                            <item.icon className="w-4 h-4 text-muted-foreground" />
                            {item.title}
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <PWAInstallButton as={DropdownMenuItem} className="cursor-pointer" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2 text-muted-foreground" />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Disable PWA artifacts and unregister service workers
    try {
      localStorage.setItem('pwa-install-dismissed', 'true');
      const existingManifest = document.querySelector('link[rel="manifest"]');
      if (existingManifest) existingManifest.remove();

      ['apple-mobile-web-app-capable','apple-mobile-web-app-status-bar-style','apple-mobile-web-app-title','theme-color','mobile-web-app-capable']
        .forEach((name) => {
          const el = document.querySelector(`meta[name="${name}"]`);
          if (el) el.remove();
        });

      const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (appleIcon) appleIcon.remove();

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((reg) => reg.unregister())).catch(() => {});
      }
    } catch (_) {
      // No-op: disabling PWA should never block app render
    }

    // Ensure Tail Number is not required anywhere the form appears
    const unsetTailRequired = () => {
      const inputs = document.querySelectorAll('input#tail_number');
      inputs.forEach((el) => {
        if (el.required || el.hasAttribute('required')) {
          el.required = false;
          el.removeAttribute('required');
        }
      });
    };
    // Run once now and keep watching for dynamic mounts (NewFlight page or edit modal)
    unsetTailRequired();
    let mutationObserver; // Declare here so it's accessible in both cleanup returns
    try {
      mutationObserver = new MutationObserver(() => unsetTailRequired());
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    } catch (_) {
      console.warn("Failed to initialize MutationObserver to unset tail number requirement.");
    }

    // Check if the script already exists to prevent duplicates
    if (document.getElementById('google-analytics-script')) {
      // If GA script already exists, just return cleanup for the mutation observer
      return () => {
        try { if (mutationObserver) mutationObserver.disconnect(); } catch (_) {}
      };
    }

    // Create the main gtag script element
    const scriptGtag = document.createElement('script');
    scriptGtag.async = true;
    scriptGtag.src = `https://www.googletagmanager.com/gtag/js?id=G-QYZQWGS2ZY`;
    scriptGtag.id = 'google-analytics-script';

    // Create the inline config script
    const scriptConfig = document.createElement('script');
    scriptConfig.id = 'google-analytics-config';
    scriptConfig.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-QYZQWGS2ZY');
    `;

    // Append scripts to the document head
    document.head.appendChild(scriptGtag);
    document.head.appendChild(scriptConfig);

    // Add Stripe.js script
    if (!document.getElementById('stripe-js-script')) {
      const stripeScript = document.createElement('script');
      stripeScript.id = 'stripe-js-script';
      stripeScript.src = 'https://js.stripe.com/v3/';
      stripeScript.async = true;
      document.head.appendChild(stripeScript);
    }

    // Cleanup function to remove scripts if the layout unmounts
    return () => {
      const gaScript = document.getElementById('google-analytics-script');
      const gaConfig = document.getElementById('google-analytics-config');
      if (gaScript) document.head.removeChild(gaScript);
      if (gaConfig) document.head.removeChild(gaConfig);

      const stripeScript = document.getElementById('stripe-js-script');
      if (stripeScript) document.head.removeChild(stripeScript);
      
      try { if (mutationObserver) mutationObserver.disconnect(); } catch (_) {}
    };
  }, []);

  if (currentPageName === "Home" || currentPageName === "PublicLogbook") {
    return <>{children}</>;
  }

  const NavLink = ({ item }) => (
    <Link
      to={item.url}
      className={`relative group transition-colors text-sm font-medium py-2 whitespace-nowrap ${
        location.pathname === item.url ? 'text-primary' : 'text-muted-foreground hover:text-primary'
      }`}
    >
      <span>{item.title}</span>
      <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 bg-primary transform transition-all duration-300 ease-out ${
          location.pathname === item.url ? 'w-full' : 'w-0 group-hover:w-full'
      }`}></span>
    </Link>
  );

  const MobileNavLink = ({ item, onClick }) => (
    <Link
      to={item.url}
      onClick={onClick}
      className={`-mx-3 flex items-center gap-4 rounded-lg px-3 py-2 text-foreground transition-colors hover:text-primary ${
          location.pathname === item.url ? 'bg-muted text-primary font-semibold' : ''
      }`}
    >
      <item.icon className="h-5 w-5" />
      {item.title}
    </Link>
  );
  
  const handleLogout = async () => {
    try {
      await UserModel.logout();
      window.location.href = window.location.origin + createPageUrl("Home");
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = window.location.origin + createPageUrl("Home");
    }
  };


  return (
    <>
      <style>{`
        :root {
          --background: 220 13% 97%;
          --foreground: 185 100% 10%;
          
          --muted: 220 9% 94%;
          --muted-foreground: 220 9% 45%;

          --popover: 0 0% 100%;
          --popover-foreground: 185 100% 10%;
          
          --card: 0 0% 100%;
          --card-foreground: 185 100% 10%;
          
          --border: 220 13% 91%;
          --input: 220 13% 91%;

          --primary: 185 95% 16%;
          --primary-foreground: 190 48% 95%;
          
          --secondary: 185 84% 39%;
          --secondary-foreground: 0 0% 100%;

          --accent: 15 50% 40%;
          --accent-foreground: 0 0% 100%;

          --destructive: 0 63% 45%;
          --destructive-foreground: 0 0% 100%;

          --ring: 185 84% 39%;
          --radius: 0.75rem;
        }

        html, body {
          overscroll-behavior-y: contain;
        }
      `}</style>
      
      <div className="min-h-screen flex flex-col w-full bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 print-hidden">
          <div className="container flex h-16 max-w-screen-2xl items-center justify-between relative">
            {/* Left Side: Logo */}
            <div className="flex items-center">
              <Link to={createPageUrl("Dashboard")} className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7221be9c8_f9fb13e95_logo.png"
                      alt="PostFlight.io Logo"
                      className="w-full h-full object-contain" />
                  </div>
                <span className="hidden font-bold sm:inline-block">PostFlight</span>
              </Link>
            </div>

            {/* Centered Navigation for Desktop */}
            <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-x-4 lg:gap-x-6 text-sm">
                {mainNavigationItems.map(item => <NavLink key={item.title} item={item} />)}
            </nav>

            {/* Right Side: User Menu & Mobile Trigger */}
            <div className="flex items-center justify-end space-x-4">
                <div className="hidden md:block">
                    <UserMenu />
                </div>
                
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                        <MenuIcon className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-sm p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                        <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7221be9c8_f9fb13e95_logo.png"
                            alt="PostFlight.io Logo"
                            className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">PostFlight</h2>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {mainNavigationItems.map(item => <MobileNavLink key={item.title} item={item} onClick={() => setMobileMenuOpen(false)} />)}
                    </nav>

                    <div className="mt-auto space-y-1">
                        <div className="text-xs font-semibold text-muted-foreground uppercase p-3">Account</div>
                        {userMenuItems.map(item => <MobileNavLink key={item.title} item={item} onClick={() => setMobileMenuOpen(false)} />)}
                        
                        <PWAInstallButton
                            as={Button}
                            variant="ghost"
                            className="w-full justify-start -mx-3"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start -mx-3 hover:bg-destructive/10 hover:text-destructive">
                        <LogOut className="h-5 w-5 mr-4" />
                        Logout
                        </Button>
                    </div>
                    </SheetContent>
                </Sheet>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}

