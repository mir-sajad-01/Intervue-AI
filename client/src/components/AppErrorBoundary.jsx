import { Component } from 'react';

class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-16">
          <section role="alert" className="panel p-6 text-center sm:p-8">
            <h1 className="text-xl font-bold text-slate-950 dark:text-white">This page could not be loaded</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Check your connection and reload the page.</p>
            <button className="btn-primary mt-5" type="button" onClick={() => window.location.reload()}>Reload page</button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
