import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, FileText, Sparkles, Zap, ArrowRight, Check, 
  Upload, MessageSquare, Download, Eye, Palette, 
  Star, Globe, Users, TrendingUp 
} from "lucide-react";
import logoImage from "../assets/notegpt-logo.png";

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
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-2xl bg-white p-3 relative z-10">
                  <img 
                    src={logoImage} 
                    alt="NoteGPT" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75"></div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Transform Your Content into
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered Notes</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Upload any document or paste text, and watch our multi-model AI instantly create structured, beautiful study notes with visual elements and smart insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                onClick={onGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating Notes
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500" />
                <span>No signup required</span>
                <Check className="w-4 h-4 text-green-500 ml-4" />
                <span>Free to use</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-sm font-semibold rounded-full">
                🚀 BETA VERSION - New Features Coming Soon!
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powered by Advanced AI Models
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our multi-model approach combines the best AI technologies for superior results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Google Gemini AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Latest Gemini 2.5-Flash model for lightning-fast content analysis and intelligent summarization
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Visual AI Designer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  AI-powered visual elements with charts, diagrams, and infographics for enhanced learning
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-200 dark:hover:border-green-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Multi-Model Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
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
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              From upload to beautiful notes in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-xl">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Upload Content</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Upload PDFs, paste text, or drag & drop any document. Supports multiple formats up to 10MB.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. AI Processing</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Our multi-model AI analyzes your content and creates structured notes with key concepts and summaries.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-xl">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Get Beautiful Notes</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Perfect Notes
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
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students and professionals who are already using NoteGPT to create better study materials.
          </p>
          
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            <Sparkles className="w-6 h-6 mr-3" />
            Get Started Now - It's Free!
            <ArrowRight className="w-6 h-6 ml-3" />
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