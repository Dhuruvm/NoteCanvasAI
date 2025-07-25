import { useState } from "react";
import { InputPanel } from "@/components/input-panel";
import { MainWorkspace } from "@/components/main-workspace";
import { Button } from "@/components/ui/button";
import { GraduationCap, Leaf, Moon, Settings } from "lucide-react";
import notegptLogo from "@/assets/notegpt-logo.png";

export default function Home() {
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);
  const [mode, setMode] = useState<"study" | "calm" | "dark">("study");

  const handleNoteCreated = (noteId: number) => {
    setCurrentNoteId(noteId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={notegptLogo} 
                alt="NoteGPT" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain"
              />
              <div className="hidden xs:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">NoteGPT</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI Study Notes Generator</p>
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={mode === "study" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("study")}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium"
                >
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Study</span>
                </Button>
                <Button
                  variant={mode === "calm" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("calm")}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium"
                >
                  <Leaf className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Calm</span>
                </Button>
                <Button
                  variant={mode === "dark" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("dark")}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium"
                >
                  <Moon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Dark</span>
                </Button>
              </div>
              
              <div className="flex items-center">
                <img 
                  src="/src/assets/notegpt-logo.png" 
                  alt="NoteGPT Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10 mr-3"
                />
                <h1 className="text-lg sm:text-xl font-semibold">NoteGPT</h1>
              </div>
              
              <Button variant="ghost" size="sm" className="p-1.5 sm:p-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <InputPanel onNoteCreated={handleNoteCreated} />
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2">
            <MainWorkspace noteId={currentNoteId} />
          </div>
        </div>
      </div>
    </div>
  );
}
