import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import DisclaimerModal from './components/DisclaimerModal';
import { getJurisdictionFromCoords } from './services/geminiService';
import { ScaleIcon } from './components/icons/ScaleIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { LocationIcon } from './components/icons/LocationIcon';
import { GeoLocateIcon } from './components/icons/GeoLocateIcon';
import type { ChatMessage } from './types';
import { MessageSender } from './types';
import { Analytics } from "@vercel/analytics/react"

const CHAT_HISTORY_KEY = 'legalChatHistory';
const JURISDICTION_KEY = 'legalChatJurisdiction';
const DISCLAIMER_KEY = 'legalChatDisclaimerAcknowledged';

const initialMessage: ChatMessage = {
  id: 'initial-bot-message',
  text: "Hello! I am an AI assistant here to provide general information on legal rights. How can I help you today? Please remember, I'm not a lawyer and this isn't legal advice.",
  sender: MessageSender.BOT,
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages) as ChatMessage[];
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages;
        }
      }
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
    }
    return [initialMessage];
  });
  
  const [jurisdiction, setJurisdiction] = useState<string>(() => {
    return localStorage.getItem(JURISDICTION_KEY) || '';
  });

  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const hasAcknowledged = localStorage.getItem(DISCLAIMER_KEY);
    if (hasAcknowledged !== 'true') {
        setIsDisclaimerOpen(true);
    }
  }, []);

  useEffect(() => {
    try {
      const serializableMessages = messages.map(({ retryRequest, ...rest }) => rest);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(serializableMessages));
    } catch (error) {
      console.error("Failed to save chat history to localStorage", error);
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(JURISDICTION_KEY, jurisdiction);
  }, [jurisdiction]);

  const handleAcknowledgeDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
    setIsDisclaimerOpen(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([initialMessage]);
    }
  };

  const handleGeolocate = async () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const locationName = await getJurisdictionFromCoords(
                    position.coords.latitude,
                    position.coords.longitude
                );
                if (locationName) {
                    setJurisdiction(locationName);
                } else {
                    alert('Could not determine your location. Please set it manually.');
                }
            } catch (error) {
                console.error("Error getting jurisdiction from coords:", error);
                alert('An error occurred while fetching your location details.');
            } finally {
                setIsLocating(false);
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
            let message = 'Could not get your location.';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Geolocation permission denied. Please enable it in your browser settings.';
            }
            alert(message);
            setIsLocating(false);
        }
    );
  };


  return (
    <>
      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={handleAcknowledgeDisclaimer} />
      <div className="flex flex-col h-screen bg-transparent text-white font-sans">
        <header className="bg-gray-900/60 backdrop-blur-sm p-4 border-b border-gray-700/50 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <ScaleIcon className="w-7 h-7 text-blue-400" />
              <h1 className="text-xl md:text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 bg-[length:200%_auto] animate-text-pan">
                Legal Rights Chatbot
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <LocationIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="Set Jurisdiction"
                  className="w-40 sm:w-48 bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                 <button
                    onClick={handleGeolocate}
                    disabled={isLocating}
                    title="Use my current location"
                    aria-label="Use my current location"
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLocating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <GeoLocateIcon className="w-4 h-4" />
                    )}
                </button>
              </div>
              <button
                onClick={handleClearHistory}
                title="Clear chat history"
                aria-label="Clear chat history"
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-hidden">
          <ChatWindow
            messages={messages}
            setMessages={setMessages}
            jurisdiction={jurisdiction}
          />
        </main>

        <footer className="bg-gray-900/60 p-3 text-center text-xs text-gray-400 border-t border-gray-700/50">
          Disclaimer: This is an AI-powered tool for informational purposes only and does not constitute legal advice. Always consult a qualified legal professional.
        </footer>
        <Analytics />
      </div>
    </>
  );
};

export default App;