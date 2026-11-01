import { Component, type ReactNode } from 'react'
import { Mascot } from './Mascot'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: unknown) { console.error('Unhandled UI error', err) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-screen place-content-center justify-items-center gap-3 p-6 text-center">
        <Mascot size={110} mood="sleepy" />
        <h1 className="display text-2xl">Something went sideways</h1>
        <p className="max-w-xs text-sm text-mute">The page hit an unexpected error. Your data is safe.</p>
        <button className="btn btn-primary" onClick={() => location.assign('/')}>Back to start</button>
      </div>
    )
  }
}
