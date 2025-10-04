import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppMode = window.navigator.standalone === true;
    setIsInstalled(isInStandaloneMode || isInWebAppMode);

    // Listen for the beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isInstalled) {
        setShowButton(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS or if no beforeinstallprompt event, show button if not installed
    if ((iOS || !deferredPrompt) && !isInstalled) {
      setShowButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt && !isIOS) {
      // Chrome/Edge installation
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowButton(false);
      }
    } else {
      // Show instructions for iOS or unsupported browsers
      setShowInstructions(true);
    }
  };

  // Don't show button if app is already installed
  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="w-full justify-start text-left hover:bg-secondary/10 hover:text-secondary transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          {isIOS ? (
            <Smartphone className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="font-medium">Install App</span>
        </div>
      </Button>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isIOS ? (
                <Smartphone className="w-5 h-5 text-primary" />
              ) : (
                <Monitor className="w-5 h-5 text-primary" />
              )}
              Install PostFlight.io
            </DialogTitle>
            <DialogDescription className="text-left">
              {isIOS ? (
                <div className="space-y-3">
                  <p>To install PostFlight.io on your iOS device:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Tap the Share button <span className="inline-block w-4 h-4 bg-blue-500 text-white text-center leading-4 rounded text-xs">↗</span> in Safari</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to confirm</li>
                  </ol>
                  <p className="text-sm text-slate-600">
                    The app will then be available on your home screen like any other app.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p>Your browser doesn't support automatic installation.</p>
                  <p className="text-sm text-slate-600">
                    Try using Chrome, Edge, or another modern browser to install PostFlight.io as an app.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}