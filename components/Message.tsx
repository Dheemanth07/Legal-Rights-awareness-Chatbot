
import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import type { ChatMessage } from '../types';
import { MessageSender } from '../types';
import { generateSpeechFromText } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

import { ThumbUpIcon } from './icons/ThumbUpIcon';
import { ThumbDownIcon } from './icons/ThumbDownIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { BotIcon } from './icons/BotIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { LinkIcon } from './icons/LinkIcon';

interface MessageProps {
  message: ChatMessage;
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void;
  onSuggestionClick?: (suggestion: string) => void;
}

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1">
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-150"></span>
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-300"></span>
  </div>
);

const RetryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691v4.992" />
    </svg>
);

const Message: React.FC<MessageProps> = ({ message, onFeedback, onSuggestionClick }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isUser = message.sender === MessageSender.USER;
  const isBot = !isUser;

  const containerClasses = isUser
    ? 'flex justify-end'
    : 'flex items-start justify-start gap-2.5';
  
  const bubbleClasses = isUser
    ? 'bg-blue-600 text-white rounded-br-none'
    : message.isError
    ? 'bg-red-900/60 text-red-200 rounded-bl-none'
    : 'bg-gray-700 text-gray-200 rounded-bl-none';

  const handlePlayAudio = async () => {
    if (audioState === 'loading' || audioState === 'playing') {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
      setAudioState('idle');
      return;
    }

    setAudioState('loading');
    const audioData = await generateSpeechFromText(message.text);
    if (audioData) {
      try {
        if (!audioContextRef.current) {
          // Fix for line 71: Property 'webkitAudioContext' does not exist on type 'Window & typeof globalThis'. Did you mean 'AudioContext'?
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
          } else {
            throw new Error("Web Audio API not supported");
          }
        }
        
        const decodedBytes = decode(audioData);
        const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setAudioState('idle');
            audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
        setAudioState('playing');

      } catch (error) {
        console.error("Error playing audio:", error);
        setAudioState('error');
      }
    } else {
      setAudioState('error');
    }
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    }
  };

  const renderContent = () => {
    if (message.isLoading && !message.text) {
        return <LoadingIndicator />;
    }
    if (message.isError) {
        return (
            <div className="flex flex-col items-start">
                <p className="text-sm">{message.text}</p>
                {message.retryRequest && (
                    <button
                        onClick={message.retryRequest}
                        title="Retry sending the message"
                        className="mt-3 inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900/60 focus:ring-blue-500"
                    >
                        <RetryIcon />
                        Retry
                    </button>
                )}
            </div>
        );
    }
    
    if (!message.text) return null;

    const baseHtml = marked.parse(message.text) as string;
    const finalHtml = message.isLoading ? baseHtml + '<span class="w-2.5 h-5 bg-current animate-pulse inline-block ml-1"></span>' : baseHtml;

    return (
        <div 
            className="prose prose-invert max-w-none prose-p:text-gray-200 prose-p:mb-4 prose-headings:text-white prose-headings:mb-3 prose-strong:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-blockquote:not-italic prose-blockquote:border-l-blue-400 prose-blockquote:pl-4 prose-blockquote:text-gray-300 prose-hr:border-gray-600" 
            dangerouslySetInnerHTML={{ __html: finalHtml }} 
        />
    );
  };
  
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className={`${containerClasses} animate-in`}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center self-start">
          <BotIcon className="w-5 h-5 text-gray-300" />
        </div>
      )}
      <div className="flex flex-col">
        <div className={`max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${bubbleClasses}`}>
            {message.image && (
                <img 
                    src={message.image}
                    alt="User upload"
                    className="max-w-xs rounded-lg mb-2"
                />
            )}
            {renderContent()}
            {isBot && hasSources && (
                <div className="mt-4 pt-3 border-t border-gray-600">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4" />
                        Sources
                    </h4>
                    <ul className="space-y-1">
                        {message.sources?.map((source, index) => (
                            <li key={index} className="truncate">
                                <a 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                    title={source.title}
                                >
                                    {index + 1}. {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
        {isBot && !message.isLoading && !message.isError && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap justify-start gap-2 mt-3 animate-fade-in">
                {message.suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick?.(suggestion)}
                        className="px-4 py-2 bg-gray-700/50 text-blue-300 rounded-full text-sm hover:bg-gray-700 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        )}
      </div>
      {isBot && !message.isLoading && !message.isError && message.text && (
        <div className="flex shrink-0 self-start mt-1.5 space-x-1 ml-1">
          <button
              onClick={handlePlayAudio}
              aria-label="Play audio"
              title="Read text aloud"
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <SpeakerIcon className="w-4 h-4" state={audioState} />
          </button>
          <div className="relative">
            <button
              onClick={handleCopy}
              aria-label="Copy message"
              title="Copy message"
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
            {isCopied && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap animate-fade-in">
                Copied!
              </div>
            )}
          </div>
          <button
            onClick={() => onFeedback(message.id, 'up')}
            disabled={!!message.feedback}
            aria-label="Good response"
            title="Good response"
            className={`p-1.5 rounded-full transition-colors disabled:cursor-not-allowed ${
              message.feedback === 'up'
                ? 'text-green-400 bg-gray-800'
                : message.feedback
                ? 'text-gray-600'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <ThumbUpIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFeedback(message.id, 'down')}
            disabled={!!message.feedback}
            aria-label="Bad response"
            title="Bad response"
            className={`p-1.5 rounded-full transition-colors disabled:cursor-not-allowed ${
              message.feedback === 'down'
                ? 'text-red-400 bg-gray-800'
                : message.feedback
                ? 'text-gray-600'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <ThumbDownIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Message;