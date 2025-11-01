import React from 'react';

export const BotIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c.251.023.501.05.75.082m.75.082a24.301 24.301 0 0 1 4.5 0m4.5 0a24.301 24.301 0 0 1 4.5 0m-4.5 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" 
        />
    </svg>
);