import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { chatbotConfig } from '../../config/chatbot';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const DashboardPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi there! I'm Stan, your AI social media growth coach. I'm here to help you build an amazing online presence. What would you like to work on today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const chatbotResponses = [
    "Great question! Let's dive into your social media strategy. What platform are you focusing on?",
    "I can help you with that! Here are some proven tactics for increasing engagement...",
    "Based on current trends, I recommend focusing on authentic storytelling and consistent posting.",
    "That's a smart approach! Let me suggest some content ideas that align with your goals.",
    "Perfect! Here's a personalized growth strategy based on your current situation..."
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chatbot embed code if provided
    if (chatbotConfig.embedCode && chatbotConfig.embedCode.includes('<script>')) {
      try {
        const scriptContent = chatbotConfig.embedCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptContent) {
          // Execute chatbot initialization code
          eval(scriptContent[0].replace(/<\/?script[^>]*>/g, ''));
        }
      } catch (error) {
        console.log('Chatbot embed code execution:', error);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: chatbotResponses[Math.floor(Math.random() * chatbotResponses.length)],
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, <span className="bg-gradient-to-r from-blue-500 to-yellow-500 bg-clip-text text-transparent">{user?.email?.split('@')[0]}</span>!
                </h1>
                <p className="text-gray-600">
                  Your AI social media coach is ready to help you grow your online presence.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4" />
                <span>Pro Plan Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chatbot Integration Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-yellow-500 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-white">
                <h3 className="font-semibold">Stan - AI Growth Coach</h3>
                <p className="text-sm opacity-90">Online and ready to help</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.isUser ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                  message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-blue-500 to-yellow-500' 
                      : 'bg-gray-200'
                  }`}>
                    {message.isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-gradient-to-r from-blue-500 to-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about social media growth..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* External Chatbot Embed */}
        {chatbotConfig.embedCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Advanced AI Coach
            </h3>
            <div 
              dangerouslySetInnerHTML={{ __html: chatbotConfig.embedCode }}
              className="chatbot-container"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};