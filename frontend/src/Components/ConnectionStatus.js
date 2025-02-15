import React from 'react';
import { RefreshCw } from 'lucide-react';

const ConnectionStatus = ({ isConnected, onRefresh, isRefreshing }) => {
    return (
        <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Reconnecting...'}
            </span>
            <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors"
                title="Refresh connection"
            >
                <RefreshCw
                    className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : 'hover:text-gray-900'}`}
                />
            </button>
        </div>
    );
};

export default ConnectionStatus;