import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, FileText, Sparkles, Zap, ArrowRight, Check, 
  Upload, MessageSquare, Download, Eye, Palette, 
  Star, Globe, Users, TrendingUp 
} from "lucide-react";
import logoImage from "@assets/file_00000000fe2861f5a8308fe4bd6247b6_1753525054263.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative container mx-auto px-4 sm:px-6 pt-20 pb-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex justify-center items-center mb-8">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-2xl bg-white p-4 relative z-10 logo-glow group-hover:scale-105 transition-all duration-300">
                  <img 
                    src={logoImage} 
                    alt="NoteGPT" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-3xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              </div>
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              Transform Your Content into
              <span className="block gradient-text-blue text-5xl sm:text-6xl lg:text-7xl mt-2"> AI-Powered Notes</span>
            </h1>
            
            <p className="font-body text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
              Upload any document or paste text, and watch our multi-model AI instantly create structured, beautiful study notes with visual elements and smart insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
              <Button 
                onClick={onGetStarted}
                size="lg" 
                className="btn-premium text-white px-12 py-5 text-xl font-semibold rounded-full shadow-2xl font-heading tracking-wide"
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Start Creating Notes
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
              
              <div className="flex items-center space-x-6 text-base text-gray-600 dark:text-gray-400 font-body font-medium">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>No signup required</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Free to use</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 text-base font-bold rounded-full font-heading shadow-lg">
                🚀 BETA VERSION - New Features Coming Soon!
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              Powered by <span className="gradient-text-purple">Advanced AI Models</span>
            </h2>
            <p className="font-body text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed">
              Our multi-model approach combines the best AI technologies for superior results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-200 dark:hover:border-blue-700 hover:scale-105 transform bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-gray-900 mb-3">Google Gemini AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Latest Gemini 2.5-Flash model for lightning-fast content analysis and intelligent summarization
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-purple-200 dark:hover:border-purple-700 hover:scale-105 transform bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-gray-900 mb-3">Visual AI Designer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  AI-powered visual elements with charts, diagrams, and infographics for enhanced learning
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-green-200 dark:hover:border-green-700 hover:scale-105 transform bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-gray-900 mb-3">Multi-Model Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Combined power of multiple AI models including Mixtral-8x7B and specialized layout analyzers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="font-body text-xl sm:text-2xl text-gray-600 dark:text-gray-300 font-medium">
              From upload to beautiful notes in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Upload className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">1. Upload Content</h3>
              <p className="font-body text-gray-600 dark:text-gray-300 text-xl leading-relaxed">
                Upload PDFs, paste text, or drag & drop any document. Supports multiple formats up to 10MB.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">2. AI Processing</h3>
              <p className="font-body text-gray-600 dark:text-gray-300 text-xl leading-relaxed">
                Our multi-model AI analyzes your content and creates structured notes with key concepts and summaries.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Download className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">3. Get Beautiful Notes</h3>
              <p className="font-body text-gray-600 dark:text-gray-300 text-xl leading-relaxed">
                Download professionally formatted PDFs with visual elements, or customize the design to your liking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              Everything You Need for <span className="gradient-text-blue">Perfect Notes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-200">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Smart Summarization</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">AI extracts key concepts and creates structured summaries</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-200">
              <Eye className="w-8 h-8 text-purple-600 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Visual Elements</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Charts, diagrams, and infographics enhance understanding</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-200">
              <Palette className="w-8 h-8 text-green-600 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Custom Design</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Multiple themes and color schemes for personalized notes</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-200">
              <Download className="w-8 h-8 text-orange-600 mx-auto mb-4" />
              <h4 className="font-semibent mb-2">Export Options</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Download as PDF with professional formatting</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-lg opacity-90">Notes Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-lg opacity-90">User Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">6+</div>
              <div className="text-lg opacity-90">AI Models</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-lg opacity-90">Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
            Ready to Transform Your <span className="gradient-text">Learning?</span>
          </h2>
          <p className="font-body text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
            Join thousands of students and professionals who are already using NoteGPT to create better study materials.
          </p>
          
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="btn-premium text-white px-16 py-6 text-2xl font-bold rounded-full shadow-2xl font-heading tracking-wide"
          >
            <Sparkles className="w-7 h-7 mr-4" />
            Get Started Now - It's Free!
            <ArrowRight className="w-7 h-7 ml-4" />
          </Button>
          
          <div className="mt-6 flex justify-center items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-1" />
              No credit card required
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-1" />
              Start immediately
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-1" />
              Full features in beta
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-white p-1">
                <img 
                  src={logoImage} 
                  alt="NoteGPT" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">NoteGPT</span>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                    BETA
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">AI-Powered Note Generation</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © 2025 NoteGPT. Powered by advanced AI technology.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Built with Google Gemini AI, Multi-Model Processing & Visual Intelligence
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}