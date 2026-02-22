# NotePath

## Clerk + React (Vite) setup

Official quickstart: https://clerk.com/docs/react/getting-started/quickstart

1. Install dependencies:

```bash
npm install
npm install @clerk/clerk-react@latest
```

2. Add environment variables in `.env.local` (preferred for local secrets):

```bash
VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_CONVEX_URL=YOUR_CONVEX_URL
```

3. Wrap the app in `ClerkProvider` in `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import './index.css'
import App from './App.tsx'

const convexUrl = import.meta.env.VITE_CONVEX_URL
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!convexUrl) throw new Error('Missing VITE_CONVEX_URL in environment')
if (!clerkPublishableKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment')

const convex = new ConvexReactClient(convexUrl)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
)
```

4. Use Clerk components in `src/App.tsx`:

```tsx
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react'

export default function App() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  )
}
```

`frontendApi` and older variable names like `REACT_APP_CLERK_FRONTEND_API` are not used in this Vite setup.
