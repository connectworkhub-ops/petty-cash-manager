import React from 'react';

const LoadingSpinner = ({ fullPage = false }) => {
    const spinner = (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-midnight-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
