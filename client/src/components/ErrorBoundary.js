import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{ borderColor: '#ff4444', textAlign: 'center' }}>
          <h2 style={{ color: '#ff4444' }}>⚠️ Visualization Error</h2>
          <p>The mathematical output was too complex or invalid to render.</p>
          <button className="btn-outline" onClick={() => this.setState({ hasError: false })}>Reset Visualizer</button>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;