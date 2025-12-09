import React, { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const Toast = ({ id, message, type }) => {
    const { removeToast } = useToast();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => removeToast(id), 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    const getColors = () => {
        switch (type) {
            case 'success': return 'bg-green-500 border-green-600';
            case 'error': return 'bg-red-500 border-red-600';
            case 'warning': return 'bg-yellow-500 border-yellow-600';
            default: return 'bg-blue-500 border-blue-600';
        }
    };
    return (
        <div
            className={`transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <div className={`flex items-center p-4 mb-2 text-white rounded-lg shadow-lg ${getColors()} min-w-80`}>
                <span className="text-lg mr-3">{getIcon()}</span>
                <span className="flex-1 text-sm font-medium">{message}</span>
                <button
                    onClick={handleClose}
                    className="ml-3 text-white hover:text-gray-200 font-bold text-lg"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast;