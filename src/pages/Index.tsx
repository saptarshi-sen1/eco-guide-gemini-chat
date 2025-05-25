
import { useState, useRef, useEffect } from 'react';
import { Send, Recycle, Trash2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        content: "🌱 Hello! I'm your Eco-Waste Assistant, here to help you make environmentally conscious decisions about waste disposal. I can guide you on how to properly handle different types of waste including recyclables, organic waste, hazardous materials, electronics, and more. What type of waste would you like to learn about today?",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key to continue.",
        variant: "destructive"
      });
      return;
    }
    setShowApiKeyInput(false);
    toast({
      title: "API Key Set",
      description: "You can now start chatting with your Eco-Waste Assistant!",
    });
  };

  const callGeminiAPI = async (message: string) => {
    const systemPrompt = `You are an Eco-Waste Assistant, a helpful and knowledgeable chatbot specialized in waste management and environmental sustainability. Your role is to:

1. Provide accurate, practical guidance on how to handle different types of waste (recyclable, organic, hazardous, electronic, textile, construction, etc.)
2. Be kind, respectful, and encouraging in all interactions
3. Educate users about environmental impact and sustainable practices
4. Offer location-general advice since you don't have access to specific local regulations
5. Suggest users check local guidelines for specific disposal locations
6. Promote reduce, reuse, recycle principles
7. Be supportive and non-judgmental about users' current waste practices

Always maintain a helpful, educational, and environmentally conscious tone. Provide specific, actionable advice while being encouraging about making positive environmental changes.`;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt + "\n\nUser question: " + message
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't process your request. Please try again.";
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponse = await callGeminiAPI(inputMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please check your API key and try again.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please check your API key and try again. In the meantime, remember that most waste can be categorized into recyclables (paper, plastic, glass), organic waste (food scraps for composting), and items that need special disposal (electronics, batteries, hazardous materials).",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showApiKeyInput) {
        handleApiKeySubmit();
      } else {
        handleSendMessage();
      }
    }
  };

  const wasteCategories = [
    { name: "Recyclables", icon: Recycle, color: "bg-blue-100 text-blue-800" },
    { name: "Organic Waste", icon: Leaf, color: "bg-green-100 text-green-800" },
    { name: "Hazardous Materials", icon: Trash2, color: "bg-red-100 text-red-800" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Recycle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800">Eco-Waste Assistant</h1>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Your intelligent guide to responsible waste management and environmental sustainability
            </p>
            
            {/* Waste Category Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {wasteCategories.map((category) => (
                <Badge key={category.name} className={`${category.color} px-3 py-2 font-medium`}>
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          {showApiKeyInput && (
            <Card className="mb-6 border-green-200 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  Setup Required
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">
                  To get started, please enter your Gemini API key. This allows me to provide you with intelligent, personalized waste management guidance.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter your Gemini API key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleApiKeySubmit}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Connect
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Your API key is stored locally and never shared. Get your free key at: 
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline ml-1">
                    Google AI Studio
                  </a>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Chat Interface */}
          {!showApiKeyInput && (
            <Card className="h-[600px] flex flex-col shadow-lg border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Recycle className="w-5 h-5" />
                  Chat with your Eco-Waste Assistant
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-green-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-gray-500 ml-2">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me about waste disposal, recycling, or environmental tips..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {['How to recycle plastic?', 'Composting tips', 'Battery disposal', 'E-waste management'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
