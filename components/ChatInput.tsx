import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputProps {
  onSendMessage: (text: string, image?: string | null) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'confirming'>('idle');
  const recognitionRef = useRef<any | null>(null);
  const manuallyStopped = useRef(false);

  const isListening = voiceState === 'listening';

  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn("Speech Recognition not supported by this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      manuallyStopped.current = false;
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };

    recognition.onend = () => {
      if (manuallyStopped.current) {
        setVoiceState('idle');
        return;
      }
      
      if (textareaRef.current && textareaRef.current.value.trim()) {
        setVoiceState('confirming');
      } else {
        setVoiceState('idle');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setVoiceState('idle');
    };
    
    recognitionRef.current = recognition;
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      manuallyStopped.current = true;
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setVoiceState('listening');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = text.trim() || (image ? "Simplify the legal text in this document." : "");
    if (messageText) {
      onSendMessage(messageText, image);
      setText('');
      setImage(null);
    }
    setVoiceState('idle');
  };
  
  const handleConfirmSend = () => {
      if (text.trim()) {
        onSendMessage(text, image);
        setText('');
        setImage(null);
      }
      setVoiceState('idle');
  };
  
  const handleRerecord = () => {
      setText('');
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setVoiceState('listening');
      } else {
        setVoiceState('idle');
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div>
      {image && (
        <div className="p-2 bg-gray-800 rounded-t-2xl border-b border-gray-700 animate-in">
          <div className="relative inline-block">
            <img src={image} alt="upload preview" className="max-h-24 rounded-lg" />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-gray-700 rounded-full text-white hover:bg-gray-600"
              aria-label="Remove image"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={`flex items-end space-x-2 p-2 bg-gray-800 border border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-200 ${image ? 'rounded-b-2xl' : 'rounded-2xl'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
         <button
            type="button"
            onClick={handleAttachClick}
            disabled={isLoading}
            aria-label="Attach file"
            title="Attach file"
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-white bg-gray-600 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-gray-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
        >
            <PaperclipIcon className="w-5 h-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or attach a document..."
          className="flex-grow bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none resize-none max-h-48 p-2"
          rows={1}
          disabled={isLoading}
        />
        {voiceState === 'confirming' ? (
            <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                    type="button"
                    onClick={handleRerecord}
                    className="px-4 h-10 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors text-sm font-semibold"
                    aria-label="Re-record message"
                >
                    Retry
                </button>
                <button
                    type="button"
                    onClick={handleConfirmSend}
                    className="px-4 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors text-sm font-semibold flex items-center"
                    aria-label="Confirm and send message"
                >
                    Send
                </button>
            </div>
        ) : (
            <>
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoading}
                  aria-label={isListening ? 'Stop listening' : 'Start listening'}
                  title={isListening ? 'Stop recording' : 'Record your question'}
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-white transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${isListening ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-600'}`}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (!text.trim() && !image)}
                  aria-label="Send message"
                  title="Send message"
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 rounded-full text-white transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </button>
            </>
        )}
      </form>
    </div>
  );
};

export default ChatInput;