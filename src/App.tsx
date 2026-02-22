import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import { useConvexAuth } from 'convex/react'
import './App.css'

function App() {
  const { isLoading, isAuthenticated } = useConvexAuth()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>NotePath</h1>
        <SignedOut>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <SignInButton mode="modal">
              <button type="button">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button">Sign up</button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
      <div className="card">
        {isLoading && <p>Checking authentication...</p>}
        {!isLoading && isAuthenticated && <p>Authenticated with Clerk and Convex.</p>}
        {!isLoading && !isAuthenticated && <p>Sign in to use authenticated Convex functions.</p>}
      </div>
    </>
  )
}

export default App
