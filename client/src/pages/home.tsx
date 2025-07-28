import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InputPanel } from "@/components/input-panel";
import { MainWorkspace } from "@/components/main-workspace";
import { LandingPage } from "@/components/landing-page";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Sparkles, Settings, Palette, Eye, Layout, Send, Plus } from "lucide-react";

export default function Home() {
  const [noteId, setNoteId] = useState<number | null>(null);
  const [isGearOpen, setIsGearOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [preferences, setPreferences] = useState({
    autoSave: true,
    visualEffects: true,
    compactMode: false,
    highContrast: false,
  });

  // Apply modern dark theme
  useEffect(() => {
    document.body.classList.add('dark');
    document.documentElement.style.background = '#000000';
    document.body.style.background = '#000000';
  }, []);

  // Show landing page if no noteId and showLanding is true
  if (showLanding && !noteId) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Modern Header */}
      <div className="border-b border-grayale-darker bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  NoteGPT
                </h1>
                <Badge className="bg-gradient-to-r from-grayale to-grayale-dark text-black text-xs px-2 py-1 rounded-full font-bold">
                  BETA
                </Badge>
              </div>
            </div>

            {/* Settings Button */}
            <div className="flex items-center space-x-4">
              <Sheet open={isGearOpen} onOpenChange={setIsGearOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-grayale-darker hover:border-grayale bg-black/50 hover:bg-black/70 text-grayale transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80 bg-black border-grayale-darker">
                  <SheetHeader>
                    <SheetTitle className="flex items-center text-lg font-semibold text-grayale">
                      <Settings className="w-5 h-5 mr-2 text-grayale" />
                      Settings & Preferences
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* App Preferences */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-grayale flex items-center">
                        <Layout className="w-4 h-4 mr-2" />
                        App Preferences
                      </Label>

                      <div className="space-y-3">
                        {[
                          { key: 'autoSave', label: 'Auto-save notes', desc: 'Automatically save your work' },
                          { key: 'visualEffects', label: 'Visual effects', desc: 'Enhanced animations and transitions' },
                          { key: 'compactMode', label: 'Compact mode', desc: 'Reduce spacing for more content' },
                          { key: 'highContrast', label: 'High contrast', desc: 'Better visibility and accessibility' }
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-grayale-darker hover:bg-black/50 transition-colors">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-grayale">
                                {label}
                              </div>
                              <div className="text-xs text-grayale-dark">
                                {desc}
                              </div>
                            </div>
                            <Switch 
                              checked={preferences[key as keyof typeof preferences]}
                              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, [key]: checked }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-grayale flex items-center">
                        <Eye className="w-4 h-4 mr-2" />
                        Quick Actions
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-auto p-3 flex-col space-y-1 border-grayale-darker hover:bg-black/50 hover:border-grayale text-grayale-dark hover:text-grayale transition-all duration-200"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">Clear All</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-auto p-3 flex-col space-y-1 border-grayale-darker hover:bg-black/50 hover:border-grayale text-grayale-dark hover:text-grayale transition-all duration-200"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-xs">Export</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-black">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 h-full">
            {/* Left Panel - Input */}
            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-2xl bg-black/30 border border-grayale-darker backdrop-blur-sm">
                <InputPanel onNoteCreated={setNoteId} />
              </div>
            </div>

            {/* Right Panel - Workspace */}
            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-2xl bg-black/30 border border-grayale-darker backdrop-blur-sm">
                <MainWorkspace noteId={noteId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}