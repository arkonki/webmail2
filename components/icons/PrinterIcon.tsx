import React from 'react';
export const PrinterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h10.5v8.25h-10.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75h15V18a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75v-2.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 11.25H6v-6A1.5 1.5 0 0 1 7.5 3.75h9A1.5 1.5 0 0 1 18 5.25v6z" />
    </svg>
);