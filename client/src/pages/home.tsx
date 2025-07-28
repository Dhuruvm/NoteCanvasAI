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
      <div className="border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 p-0.5">
                    <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">N</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    NoteGPT
                  </h1>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    BETA
                  </Badge>
                </div>
              </div>
            </div>

            {/* Settings Button */}
            <div className="flex items-center space-x-4">
              <Sheet open={isGearOpen} onOpenChange={setIsGearOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 hover:border-gray-600 bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80 bg-gray-900 border-gray-700">
                  <SheetHeader>
                    <SheetTitle className="flex items-center text-lg font-semibold text-white">
                      <Settings className="w-5 h-5 mr-2 text-cyan-400" />
                      Settings & Preferences
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* App Preferences */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-200 flex items-center">
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
                          <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-200">
                                {label}
                              </div>
                              <div className="text-xs text-gray-400">
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
                      <Label className="text-sm font-medium text-gray-200 flex items-center">
                        <Eye className="w-4 h-4 mr-2" />
                        Quick Actions
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-auto p-3 flex-col space-y-1 border-gray-600 hover:bg-gray-800 text-gray-300"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">Clear All</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-auto p-3 flex-col space-y-1 border-gray-600 hover:bg-gray-800 text-gray-300"
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
              <div className="rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
                <InputPanel onNoteCreated={setNoteId} />
              </div>
            </div>

            {/* Right Panel - Workspace */}
            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
                <MainWorkspace noteId={noteId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}