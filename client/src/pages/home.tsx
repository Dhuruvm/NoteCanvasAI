import { useState } from "react";
import { InputPanel } from "@/components/input-panel";
import { MainWorkspace } from "@/components/main-workspace";
import { Button } from "@/components/ui/button";
import { Brain, GraduationCap, Leaf, Moon, Settings } from "lucide-react";

export default function Home() {
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);
  const [mode, setMode] = useState<"study" | "calm" | "dark">("study");

  const handleNoteCreated = (noteId: number) => {
    setCurrentNoteId(noteId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-brand rounded-lg flex items-center justify-center">
                <Brain className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NoteGPT</h1>
                <p className="text-xs text-muted-foreground">AI Study Notes Generator</p>
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={mode === "study" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("study")}
                  className="px-3 py-1 text-sm font-medium"
                >
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Study
                </Button>
                <Button
                  variant={mode === "calm" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("calm")}
                  className="px-3 py-1 text-sm font-medium"
                >
                  <Leaf className="w-4 h-4 mr-1" />
                  Calm
                </Button>
                <Button
                  variant={mode === "dark" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("dark")}
                  className="px-3 py-1 text-sm font-medium"
                >
                  <Moon className="w-4 h-4 mr-1" />
                  Dark
                </Button>
              </div>
              
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <InputPanel onNoteCreated={handleNoteCreated} />
          </div>
          <div className="lg:col-span-2">
            <MainWorkspace noteId={currentNoteId} />
          </div>
        </div>
      </div>
    </div>
  );
}
