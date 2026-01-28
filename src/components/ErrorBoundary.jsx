import React, { Component } from 'react';

class ErrorBoundary extends Component {
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
                <div className="error-boundary">
                    <div className="error-card">
                        <span className="error-icon">😵</span>
                        <h2>Something went wrong</h2>
                        <p>The application encountered an unexpected error.</p>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#f1f5f9', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
                            {this.state.error?.message || 'Unknown Error'}
                        </p>
                        <button className="btn-retry" onClick={() => window.location.href = '/'}>
                            Go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
