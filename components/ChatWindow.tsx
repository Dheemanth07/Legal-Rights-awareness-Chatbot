
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GenerateContentResponse, Content, Part, GroundingChunk } from '@google/genai';
import { sendMessageToGeminiStream } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { MessageSender } from '../types';
import Message from './Message';
import ChatInput from './ChatInput';

const suggestionChips = [
    "Consumer Rights",
    "Landlord/Tenant Issues",
    "Workplace Rights",
];

interface ChatWindowProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  jurisdiction: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, setMessages, jurisdiction }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(() => messages.length <= 1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFeedback = useCallback((messageId: string, feedback: 'up' | 'down') => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
  }, [setMessages]);
  
  const handleSendMessage = useCallback(async (text: string, image?: string | null) => {
    if (isLoading || (!text.trim() && !image)) return;

    if (showSuggestions) {
      setShowSuggestions(false);
    }
    
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: MessageSender.USER,
      image: image,
    };
    
    const botMessageId = `bot-${Date.now()}`;
    const botLoadingMessage: ChatMessage = {
        id: botMessageId,
        text: '',
        sender: MessageSender.BOT,
        isLoading: true,
    };

    const currentMessagesWithUser = [...messages, userMessage];
    setMessages(prevMessages => [...prevMessages, userMessage, botLoadingMessage]);

    const executeApiCall = async () => {
        const history: Content[] = currentMessagesWithUser
          .slice(0, -1) 
          .filter(msg => msg.id !== 'initial-bot-message' && !msg.isLoading && !msg.isError && msg.text)
          .map(msg => ({
              role: msg.sender === MessageSender.USER ? 'user' : 'model',
              parts: [{ text: msg.text }],
          }));

        const SUGGESTION_SEPARATOR = '---SUGGESTIONS---';
        const messageWithContext = jurisdiction ? `Jurisdiction: ${jurisdiction}\n\nUser Question: ${text}` : text;

        try {
          const stream = await sendMessageToGeminiStream(messageWithContext, history, image);
          let accumulatedText = '';
          let groundingChunks: GroundingChunk[] = [];

          for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
              accumulatedText += chunkText;
              const responseText = accumulatedText.split(SUGGESTION_SEPARATOR)[0];
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, text: responseText, isLoading: true, isError: false }
                    : msg
                )
              );
            }
            const chunkGrounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunkGrounding) {
                groundingChunks.push(...chunkGrounding);
            }
          }

          let finalResponseText = accumulatedText;
          let finalSuggestions: string[] | undefined = undefined;

          if (accumulatedText.includes(SUGGESTION_SEPARATOR)) {
              const parts = accumulatedText.split(SUGGESTION_SEPARATOR);
              finalResponseText = parts[0].trim();
              const suggestionsJsonString = parts[1];
              try {
                  const parsedSuggestions = JSON.parse(suggestionsJsonString);
                  if (Array.isArray(parsedSuggestions)) {
                      finalSuggestions = parsedSuggestions;
                  }
              } catch (e) {
                  console.error("Failed to parse suggestions JSON:", e);
              }
          }
          
          const finalSources = groundingChunks
              .map(chunk => chunk.web)
              .filter((source): source is { uri: string; title: string } => !!source && !!source.uri && !!source.title);

          setMessages(prev =>
            prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, text: finalResponseText, suggestions: finalSuggestions, sources: finalSources, isLoading: false }
                : msg
            )
          );
          setIsLoading(false);
        } catch (e) {
          console.error("Gemini API Error:", e);
          let userFriendlyMessage = 'Sorry, something went wrong. Please try again later.';
          if (e instanceof Error) {
            if (e.message.toLowerCase().includes('fetch')) { // Likely a network error
              userFriendlyMessage = 'A network error occurred. Please check your internet connection and try again.';
            } else {
              userFriendlyMessage = `An unexpected error occurred. Please try again.`;
            }
          }

          const handleRetry = () => {
            setMessages(prev => prev.map(msg =>
                msg.id === botMessageId
                ? { ...botLoadingMessage, id: botMessageId }
                : msg
            ));
            executeApiCall();
          };

          setMessages(prev =>
            prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, text: userFriendlyMessage, isLoading: false, isError: true, retryRequest: handleRetry }
                : msg
            )
          );
          setIsLoading(false);
        }
    };

    await executeApiCall();

  }, [isLoading, messages, showSuggestions, setMessages, jurisdiction]);
  
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} onFeedback={handleFeedback} onSuggestionClick={handleSuggestionClick} />
        ))}
        {showSuggestions && (
          <div className="flex flex-wrap justify-start gap-2 ml-12 animate-in">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSuggestionClick(chip)}
                className="px-4 py-2 bg-gray-700/50 text-blue-300 rounded-full text-sm hover:bg-gray-700 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
