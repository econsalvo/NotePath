import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import './index.css'
import App from './App.tsx'

const convexUrl = import.meta.env.VITE_CONVEX_URL
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL in environment')
}

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment')
}

const convex = new ConvexReactClient(convexUrl)
const clerkAppearance = {
  variables: {
    colorBackground: '#0b1424',
    colorText: '#dce7f8',
    colorPrimary: '#3f6fa8',
    colorInputBackground: '#101b30',
    colorInputText: '#dce7f8',
    colorNeutral: '#8ea6c9',
    colorDanger: '#f29999',
    borderRadius: '10px',
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
)
