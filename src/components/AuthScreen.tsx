import { SignInButton, SignUpButton } from '@clerk/clerk-react'

export function AuthScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="auth-brand">NOTEPATH</p>
        <h1>Minimal notes, fast flow.</h1>
        <p className="auth-copy">
          Sign in to create and edit rich text notes synced with Convex.
        </p>
        <div className="auth-actions">
          <SignInButton mode="modal">
            <button type="button" className="btn btn-primary">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="btn btn-secondary">
              Create account
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  )
}
