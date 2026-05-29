import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className='app-status'>
          <p>Что-то пошло не так. Попробуйте перезагрузить страницу.</p>
          <p className='app-status__detail'>
            {this.state.error.message}
          </p>
          <button className='app-status__retry' onClick={this.handleReset}>
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
