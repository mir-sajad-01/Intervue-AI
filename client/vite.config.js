import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  const apiUrl = environment.VITE_API_URL?.trim();

  if (mode === 'production' && apiUrl) {
    const isSameOriginPath = apiUrl.startsWith('/') && !apiUrl.startsWith('//') && !apiUrl.includes('\\');
    if (!isSameOriginPath) {
      let parsedApiUrl;
      try {
        parsedApiUrl = new URL(apiUrl);
      } catch {
        throw new Error('VITE_API_URL must be a valid HTTPS URL or a same-origin path such as /api.');
      }
      if (parsedApiUrl.protocol !== 'https:') {
        throw new Error('VITE_API_URL must use HTTPS in production. Use /api for a same-origin proxy.');
      }
      if (parsedApiUrl.username || parsedApiUrl.password || parsedApiUrl.search || parsedApiUrl.hash || parsedApiUrl.hostname === 'localhost') {
        throw new Error('VITE_API_URL must be a public API origin or same-origin path without credentials, query, or hash.');
      }
    }
  }

  return {
    plugins: [react()],
    server: {
      // Bind explicitly to IPv4. Some Windows browser/webview setups resolve
      // `localhost` to IPv6 first while Node binds the other loopback family.
      host: '127.0.0.1',
      port: 5173,
      strictPort: true
    }
  };
});
