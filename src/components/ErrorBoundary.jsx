import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4 font-mono">
                    <AlertTriangle className="text-red-600 mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-red-800 mb-2">Something went wrong.</h1>
                    <div className="bg-white p-4 rounded shadow border border-red-200 text-sm overflow-auto max-w-2xl w-full">
                        <code className="text-red-600 break-words">
                            {this.state.error?.toString()}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
