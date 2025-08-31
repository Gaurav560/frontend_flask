// Google Configuration (supports quick override via localStorage without rebuild)
let localOverrideClientId = null
let localOverrideBackend = null
try {
  localOverrideClientId = localStorage.getItem('GOOGLE_CLIENT_ID') || null
  localOverrideBackend = localStorage.getItem('BACKEND_URL') || localStorage.getItem('VITE_BACKEND_URL') || null
} catch {}

export const VITE_GOOGLE_CLIENT_ID =
  localOverrideClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '724469503053-4hlt6hvsttage9ii33hn4n7l1j59tnef.apps.googleusercontent.com';

export const VITE_BACKEND_URL =
  localOverrideBackend || import.meta.env.VITE_BACKEND_URL || 'https://backend-footage-flow.onrender.com';

// Validate required environment variables
if (!VITE_GOOGLE_CLIENT_ID) {
  console.error('VITE_GOOGLE_CLIENT_ID is not set');
}

if (!VITE_BACKEND_URL) {
  console.error('VITE_BACKEND_URL is not set');
}

export default {
  VITE_GOOGLE_CLIENT_ID,
  VITE_BACKEND_URL
};