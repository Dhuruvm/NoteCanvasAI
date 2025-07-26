import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InputPanel } from "@/components/input-panel";
import { MainWorkspace } from "@/components/main-workspace";
import { LandingPage } from "@/components/landing-page";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Sparkles, GraduationCap, Leaf, Moon, Settings, Palette, Eye, Layout } from "lucide-react";
import logoImage from "@assets/file_00000000fe2861f5a8308fe4bd6247b6_1753525054263.png";

export default function Home() {
  const [noteId, setNoteId] = useState<number | null>(null);
  const [mode, setMode] = useState<"study" | "calm" | "dark">("study");
  const [isGearOpen, setIsGearOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [preferences, setPreferences] = useState({
    autoSave: true,
    visualEffects: true,
    compactMode: false,
    highContrast: false,
  });

  // Apply theme effects based on mode
  useEffect(() => {
    const root = document.documentElement;

    switch (mode) {
      case "study":
        root.style.setProperty('--mode-primary', 'hsl(246, 83%, 67%)');
        root.style.setProperty('--mode-accent', 'hsl(159, 61%, 51%)');
        root.style.setProperty('--mode-bg', 'hsl(0, 0%, 100%)');
        document.body.classList.remove('dark');
        break;
      case "calm":
        root.style.setProperty('--mode-primary', 'hsl(159, 61%, 51%)');
        root.style.setProperty('--mode-accent', 'hsl(200, 70%, 60%)');
        root.style.setProperty('--mode-bg', 'hsl(200, 50%, 98%)');
        document.body.classList.remove('dark');
        break;
      case "dark":
        root.style.setProperty('--mode-primary', 'hsl(262, 75%, 71%)');
        root.style.setProperty('--mode-accent', 'hsl(246, 83%, 67%)');
        root.style.setProperty('--mode-bg', 'hsl(222, 84%, 5%)');
        document.body.classList.add('dark');
        break;
    }
  }, [mode]);

  // Show landing page if no noteId and showLanding is true
  if (showLanding && !noteId) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <div className={`border-b ${mode === 'dark' ? 'border-gray-700 bg-gray-900' : mode === 'calm' ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-green-50' : 'border-gray-200 bg-white'} sticky top-0 z-50 transition-all duration-300`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-lg bg-white p-1 transition-all duration-300`}>
                  <img 
                    src={logoImage} 
                    alt="NoteGPT" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className={`text-xl sm:text-2xl font-display font-bold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} transition-colors duration-300 tracking-tight`}>
                      NoteGPT
                    </h1>
                    <p className={`text-sm sm:text-base font-body ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'} hidden sm:block transition-colors duration-300`}>
                      AI-Powered Note Generation
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-3 py-1 rounded-full font-heading font-bold shadow-lg">
                    BETA
                  </Badge>
                </div>
              </div>
            </div>

            {/* Mode Toggles and Settings */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Desktop Mode Toggles */}
              <div className={`hidden sm:flex items-center space-x-1 ${mode === 'dark' ? 'bg-gray-800' : mode === 'calm' ? 'bg-white/50 backdrop-blur-sm' : 'bg-gray-100'} rounded-xl p-1 transition-all duration-300 border ${mode === 'dark' ? 'border-gray-700' : mode === 'calm' ? 'border-blue-200' : 'border-gray-200'}`}>
                <Button
                  variant={mode === "study" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("study")}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "study" ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Study
                </Button>
                <Button
                  variant={mode === "calm" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("calm")}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "calm" ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <Leaf className="w-4 h-4 mr-2" />
                  Calm
                </Button>
                <Button
                  variant={mode === "dark" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("dark")}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "dark" ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </Button>
              </div>

              {/* Gear Settings Button */}
              <Sheet open={isGearOpen} onOpenChange={setIsGearOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`relative group ${mode === 'dark' ? 'border-gray-600 hover:border-gray-500' : mode === 'calm' ? 'border-blue-200 hover:border-blue-300 bg-white/50 backdrop-blur-sm' : 'border-gray-300 hover:border-gray-400'} transition-all duration-200 hover:shadow-lg`}
                  >
                    <Settings className={`w-4 h-4 transition-transform duration-200 group-hover:rotate-90 ${mode === 'study' ? 'text-blue-600' : mode === 'calm' ? 'text-green-600' : 'text-purple-600'}`} />
                  </Button>
                </SheetTrigger>
                <SheetContent className={`w-80 ${mode === 'dark' ? 'bg-gray-900 border-gray-700' : mode === 'calm' ? 'bg-gradient-to-b from-blue-50 to-green-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                  <SheetHeader>
                    <SheetTitle className={`flex items-center text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      <Settings className={`w-5 h-5 mr-2 ${mode === 'study' ? 'text-blue-600' : mode === 'calm' ? 'text-green-600' : 'text-purple-600'}`} />
                      Settings & Preferences
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* Theme Mode Selection */}
                    <div className="space-y-3">
                      <Label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                        <Palette className="w-4 h-4 mr-2" />
                        Theme Mode
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: 'study', label: 'Study Mode', icon: GraduationCap, desc: 'Focused and productive', color: 'from-blue-500 to-purple-600' },
                          { key: 'calm', label: 'Calm Mode', icon: Leaf, desc: 'Relaxed and peaceful', color: 'from-green-400 to-blue-500' },
                          { key: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Easy on the eyes', color: 'from-purple-500 to-pink-500' }
                        ].map(({ key, label, icon: Icon, desc, color }) => (
                          <button
                            key={key}
                            onClick={() => setMode(key as any)}
                            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                              mode === key 
                                ? `border-transparent bg-gradient-to-r ${color} text-white shadow-lg` 
                                : `border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 ${mode === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="w-5 h-5" />
                              <div>
                                <div className="font-medium">{label}</div>
                                <div className={`text-xs ${mode === key ? 'text-white/80' : mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {desc}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* App Preferences */}
                    <div className="space-y-4">
                      <Label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
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
                          <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${mode === 'dark' ? 'bg-gray-800' : mode === 'calm' ? 'bg-white/70' : 'bg-gray-50'} border ${mode === 'dark' ? 'border-gray-700' : mode === 'calm' ? 'border-blue-100' : 'border-gray-200'}`}>
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                {label}
                              </div>
                              <div className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
                      <Label className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Quick Actions
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-auto p-3 flex-col space-y-1 ${mode === 'dark' ? 'border-gray-600 hover:bg-gray-800' : mode === 'calm' ? 'border-blue-200 hover:bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">Clear All</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-auto p-3 flex-col space-y-1 ${mode === 'dark' ? 'border-gray-600 hover:bg-gray-800' : mode === 'calm' ? 'border-blue-200 hover:bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-xs">Export</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Mobile Mode Toggle */}
              <div className="sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode(mode === "study" ? "calm" : mode === "calm" ? "dark" : "study")}
                  className={`${mode === 'dark' ? 'border-gray-600' : mode === 'calm' ? 'border-blue-200 bg-white/50' : 'border-gray-300'} transition-all duration-200`}
                >
                  {mode === "study" && <GraduationCap className="w-4 h-4 text-blue-600" />}
                  {mode === "calm" && <Leaf className="w-4 h-4 text-green-600" />}
                  {mode === "dark" && <Moon className="w-4 h-4 text-purple-600" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className={`flex-1 transition-all duration-300 ${mode === 'dark' ? 'bg-gray-900' : mode === 'calm' ? 'bg-gradient-to-br from-blue-50 via-white to-green-50' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 h-full">
            {/* Left Panel - Enhanced Input */}
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-2xl shadow-xl border transition-all duration-300 ${
                mode === 'dark' 
                  ? 'bg-gray-800 border-gray-700 shadow-2xl shadow-purple-500/10' 
                  : mode === 'calm' 
                    ? 'bg-white/70 backdrop-blur-sm border-blue-200 shadow-lg shadow-blue-500/10' 
                    : 'bg-white border-gray-200 shadow-lg shadow-blue-500/10'
              }`}>
                <InputPanel onNoteCreated={setNoteId} />
              </div>
            </div>

            {/* Right Panel - Enhanced Workspace */}
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-2xl shadow-xl border transition-all duration-300 ${
                mode === 'dark' 
                  ? 'bg-gray-800 border-gray-700 shadow-2xl shadow-purple-500/10' 
                  : mode === 'calm' 
                    ? 'bg-white/70 backdrop-blur-sm border-blue-200 shadow-lg shadow-green-500/10' 
                    : 'bg-white border-gray-200 shadow-lg shadow-purple-500/10'
              }`}>
                <MainWorkspace noteId={noteId} />
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}