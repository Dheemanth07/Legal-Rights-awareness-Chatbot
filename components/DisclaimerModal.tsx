
import React from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
    >
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full mx-4 border border-gray-700 animate-in">
        <h2 id="disclaimer-title" className="text-2xl font-bold text-white mb-4">
          Before you start...
        </h2>
        <div className="text-gray-300 space-y-4">
            <p>
                This AI-powered chatbot is for informational purposes only.
            </p>
            <p>
                The content provided here is <strong className="font-semibold text-amber-300">not legal advice</strong> and does not create an attorney-client relationship. You should always consult with a qualified legal professional for advice regarding your individual situation.
            </p>
            <p>
                By clicking "Acknowledge", you agree that you understand and accept this disclaimer.
            </p>
        </div>
        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
