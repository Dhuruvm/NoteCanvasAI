import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, Send, Trophy, Zap, Brain, Target, 
  Star, Award, BookOpen, HelpCircle, CheckCircle, X 
} from "lucide-react";
import type { ChatSession, ChatMessage, UserProgress } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ChatWithPDFProps {
  noteId: number;
  noteTitle: string;
  onClose?: () => void;
}

interface QuizData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export function ChatWithPDF({ noteId, noteTitle, onClose }: ChatWithPDFProps) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState("");
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<QuizData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());
  const [userId] = useState("user_" + Math.random().toString(36).substr(2, 9));
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get chat sessions for this note
  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ["/api/notes", noteId, "chat"],
    enabled: !!noteId,
  });

  // Get messages for current session
  const { data: messages, refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", currentSession?.id, "messages"],
    enabled: !!currentSession?.id,
  });

  // Get user progress
  const { data: progress } = useQuery<UserProgress>({
    queryKey: ["/api/chat", currentSession?.id, "progress", userId],
    enabled: !!currentSession?.id,
    refetchInterval: 5000, // Update progress every 5 seconds
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (difficulty: "beginner" | "intermediate" | "advanced") => {
      const response = await apiRequest(`/api/notes/${noteId}/chat`, {
        method: "POST",
        body: JSON.stringify({
          userId,
          difficulty,
          subject: "Study Session"
        })
      });
      return response;
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      queryClient.invalidateQueries({ queryKey: ["/api/notes", noteId, "chat"] });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(`/api/chat/${currentSession!.id}/message`, {
        method: "POST",
        body: JSON.stringify({ content, userId })
      });
      return response;
    },
    onSuccess: () => {
      setMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/chat", currentSession?.id, "progress", userId] });
    }
  });

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/chat/${currentSession!.id}/quiz`, {
        method: "POST",
        body: JSON.stringify({ userId })
      });
      return response;
    },
    onSuccess: (quiz) => {
      setCurrentQuiz(quiz);
      setIsQuizMode(true);
      setQuizStartTime(Date.now());
      setSelectedAnswer("");
    }
  });

  // Submit quiz answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
      const response = await apiRequest(`/api/chat/${currentSession!.id}/quiz/answer`, {
        method: "POST",
        body: JSON.stringify({
          answer,
          correctAnswer: currentQuiz?.correctAnswer,
          difficulty: currentQuiz?.difficulty,
          timeTaken,
          userId
        })
      });
      return response;
    },
    onSuccess: (result) => {
      setTimeout(() => {
        setIsQuizMode(false);
        setCurrentQuiz(null);
        setSelectedAnswer("");
        refetchMessages();
        queryClient.invalidateQueries({ queryKey: ["/api/chat", currentSession?.id, "progress", userId] });
      }, 3000); // Show result for 3 seconds
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize session if none exists
  useEffect(() => {
    if (sessions && sessions.length > 0 && !currentSession) {
      setCurrentSession(sessions[0]);
    }
  }, [sessions, currentSession]);

  const handleSendMessage = () => {
    if (message.trim() && currentSession) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleStartQuiz = () => {
    if (currentSession) {
      generateQuizMutation.mutate();
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer && currentQuiz) {
      submitAnswerMutation.mutate(selectedAnswer);
    }
  };

  const formatMessageTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return "text-purple-600";
    if (level >= 5) return "text-blue-600";
    return "text-green-600";
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 10) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (streak >= 5) return <Star className="w-4 h-4 text-blue-500" />;
    return <Zap className="w-4 h-4 text-green-500" />;
  };

  if (!currentSession) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <span>Chat with PDF: {noteTitle}</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Start an AI-powered conversation to understand your document better
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">Choose your learning level:</p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => createSessionMutation.mutate("beginner")}
                variant="outline"
                className="flex-1 max-w-32"
                disabled={createSessionMutation.isPending}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Beginner
              </Button>
              <Button 
                onClick={() => createSessionMutation.mutate("intermediate")}
                className="flex-1 max-w-32"
                disabled={createSessionMutation.isPending}
              >
                <Target className="w-4 h-4 mr-2" />
                Intermediate
              </Button>
              <Button 
                onClick={() => createSessionMutation.mutate("advanced")}
                variant="outline"
                className="flex-1 max-w-32"
                disabled={createSessionMutation.isPending}
              >
                <Award className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main Chat Area */}
      <div className="lg:col-span-3">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Chat: {noteTitle}</h3>
              <Badge variant="outline">{currentSession.difficulty}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleStartQuiz}
                disabled={isQuizMode || generateQuizMutation.isPending}
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Quiz Me
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : msg.messageType === "quiz"
                          ? "bg-purple-100 border border-purple-200"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-100" : "text-muted-foreground"}`}>
                        {formatMessageTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quiz Mode */}
            {isQuizMode && currentQuiz && (
              <div className="p-4 border-t bg-purple-50 dark:bg-purple-950/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200">Quiz Time! 🧠</h4>
                    <Badge variant="outline">{currentQuiz.difficulty}</Badge>
                  </div>
                  
                  <p className="font-medium">{currentQuiz.question}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentQuiz.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === option ? "default" : "outline"}
                        onClick={() => setSelectedAnswer(option)}
                        className="text-left justify-start h-auto p-3"
                        disabled={submitAnswerMutation.isPending}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer || submitAnswerMutation.isPending}
                    className="w-full"
                  >
                    {submitAnswerMutation.isPending ? "Checking..." : "Submit Answer"}
                  </Button>
                  
                  {submitAnswerMutation.data && (
                    <div className={`p-3 rounded-lg ${submitAnswerMutation.data.isCorrect ? "bg-green-100 border border-green-200" : "bg-red-100 border border-red-200"}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {submitAnswerMutation.data.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {submitAnswerMutation.data.isCorrect ? "Correct!" : "Not quite right"}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{currentQuiz.explanation}</p>
                      <p className="text-sm font-medium text-blue-600">
                        {submitAnswerMutation.data.encouragement}
                      </p>
                      {submitAnswerMutation.data.rewards.pointsEarned > 0 && (
                        <p className="text-sm text-green-600">
                          +{submitAnswerMutation.data.rewards.pointsEarned} points earned!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message Input */}
            {!isQuizMode && (
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question about the content..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Sidebar */}
      <div className="space-y-4">
        {/* User Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Level</span>
                  <span className={`text-lg font-bold ${getLevelColor(progress.level)}`}>
                    {progress.level}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Points</span>
                  <span className="text-lg font-bold text-blue-600">
                    {progress.points}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Streak</span>
                  <div className="flex items-center space-x-1">
                    {getStreakIcon(progress.currentStreak)}
                    <span className="font-bold">{progress.currentStreak}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Accuracy</span>
                  <span className="font-bold">
                    {progress.totalQuestions > 0 
                      ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100)
                      : 0}%
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {progress.correctAnswers}/{progress.totalQuestions} questions correct
                </div>
                
                {progress.badges && (progress.badges as string[]).length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Badges</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(progress.badges as string[]).map((badge, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={handleStartQuiz}
              disabled={isQuizMode || generateQuizMutation.isPending}
              className="w-full"
              size="sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
            
            <Button
              onClick={() => {
                setMessage("Explain the main concepts in simple terms");
                handleSendMessage();
              }}
              variant="outline"
              className="w-full"
              size="sm"
              disabled={sendMessageMutation.isPending}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Explain Concepts
            </Button>
            
            <Button
              onClick={() => {
                setMessage("Give me a summary of the key points");
                handleSendMessage();
              }}
              variant="outline"
              className="w-full"
              size="sm"
              disabled={sendMessageMutation.isPending}
            >
              <Target className="w-4 h-4 mr-2" />
              Summarize
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}