import { StrictMode } from 'react';

import { EdificeClientProvider, EdificeThemeProvider } from '@open-ent/react';
import { ERROR_CODE } from '@open-ent/client';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './i18n';
import { router } from './routes';
import './styles/index.css';

// Le bootstrap openent n'est plus bundlé : il est chargé au runtime via
// <link href="/assets/themes/openent-bootstrap/index.css"> dans index.html
// (cf. README-THEME). Permet de changer le look sans recompiler le module.

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (typeof error === 'string') {
        if (error === ERROR_CODE.NOT_LOGGED_IN) {
          if (!window.location.pathname.includes('/pub/')) {
            window.location.replace('/auth/login');
          }
        }
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <EdificeClientProvider
        params={{
          app: 'blog',
        }}
      >
        <EdificeThemeProvider>
          <RouterProvider router={router(queryClient)} />
        </EdificeThemeProvider>
      </EdificeClientProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
