
import React from 'react';

interface SpeakerIconProps extends React.SVGProps<SVGSVGElement> {
  state: 'idle' | 'loading' | 'playing' | 'error';
}

const SpeakerWaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M12 8.25c.75 0 1.5.188 2.18.521m-4.36 0A4.49 4.49 0 0 0 8.25 12c0 .898.28 1.734.77 2.433m11.23 2.112a9.04 9.04 0 0 0-12.728 0M3.75 9.75a9.03 9.03 0 0 0-1.07 3.322c.09.832.378 1.633.82 2.373m11.164-1.31a5.23 5.23 0 0 0-7.424 0M12 12.75a2.25 2.25 0 0 0-2.25 2.25 2.25 2.25 0 0 0 2.25 2.25 2.25 2.25 0 0 0 2.25-2.25 2.25 2.25 0 0 0-2.25-2.25Z" />
    </svg>
);

const SpeakerXMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6.375a9 9 0 0 1 12.728 0M16.463 8.288a5.25 5.25 0 0 1 0 7.424M12 8.25c.75 0 1.5.188 2.18.521m-4.36 0A4.49 4.49 0 0 0 8.25 12c0 .898.28 1.734.77 2.433m-2.134-.735a9.04 9.04 0 0 0-1.88 2.186M3.75 9.75a9.03 9.03 0 0 0-1.07 3.322c.09.832.378 1.633.82 2.373" />
    </svg>
);

export const SpeakerIcon = ({ state, ...props }: SpeakerIconProps) => {
  switch (state) {
    case 'loading':
      return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>;
    case 'playing':
      return <SpeakerWaveIcon {...props} />;
    case 'error':
      return <SpeakerXMarkIcon {...props} className="text-red-400" />;
    case 'idle':
    default:
      return <SpeakerWaveIcon {...props} />;
  }
};
