import { QueryClient } from '@tanstack/react-query';
import { RouteObject, createBrowserRouter } from 'react-router-dom';

import PageError from './page-error';
import PublicPageError from './public-page-error';
import { Explorer } from 'ode-explorer/lib';
import { explorerConfig } from '~/config';

const routes = (queryClient: QueryClient): RouteObject[] => [
  {
    path: '/',
    async lazy() {
      const { loader, Root: Component } = await import('~/routes/root');
      return {
        loader,
        Component,
      };
    },
    errorElement: <PageError />,
    children: [
      {
        index: true,
        element: <Explorer config={explorerConfig} />,
      },
      // This page displays all information about the blog and its list of posts.
      {
        path: 'id/:blogId',
        async lazy() {
          const { Component, loader } = await import('~/routes/blog-root');
          return {
            loader: loader(queryClient),
            Component,
          };
        },
        children: [
          // This page displays all information about the blog and its list of posts.
          {
            index: true,
            async lazy() {
              const { Component, loader } = await import('~/routes/blog');
              return {
                loader: loader(queryClient),
                Component,
              };
            },
          },
          // This page displays a new blank post in edit mode, for a blog.
          {
            path: 'post/edit',
            async lazy() {
              const { Component, loader } = await import('~/routes/post-edit');
              return {
                loader: loader(queryClient),
                Component,
              };
            },
          },
          // This page displays an existing post from a blog.
          {
            path: 'post/:postId',
            async lazy() {
              const { Component, loader } = await import('~/routes/post');
              return {
                loader: loader(queryClient),
                Component,
              };
            },
          },
        ],
      },
    ],
  },
  // This page allows printing a blog.
  {
    path: '/print/:blogId',
    async lazy() {
      const { Component, loader } = await import('~/routes/blog-print');
      return {
        loader: loader(queryClient),
        Component,
      };
    },
  },
  // This page allows printing a post from a blog.
  {
    path: '/print/:blogId/post/:postId',
    async lazy() {
      const { Component, loader } = await import('~/routes/post-print');
      return {
        loader: loader(queryClient),
        Component,
      };
    },
  },
  // This page displays a public headless "portal", and preloads blog data.
  {
    id: 'public-portal',
    path: '/pub/:slug',
    async lazy() {
      const { Component, loader } = await import('~/routes/public-portal');
      return {
        loader: loader(queryClient),
        Component,
      };
    },
    children: [
      // This page displays a public blog.
      {
        index: true,
        async lazy() {
          const { Component, loader } = await import('~/routes/public-blog');
          return {
            loader: loader(queryClient),
            Component,
          };
        },
      },
      // This page prints a public blog.
      {
        path: 'print',
        async lazy() {
          const { loader } = await import('~/routes/public-blog');
          const { Component } = await import('~/routes/public-blog-print');
          return {
            loader: loader(queryClient),
            Component,
          };
        },
      },
      // This page displays an existing post from a public blog.
      {
        path: 'post/:postId',
        async lazy() {
          const { Component } = await import('~/routes/public-post');
          return {
            Component,
          };
        },
      },
      // This page prints an existing post from a public blog.
      {
        path: 'print/post/:postId',
        async lazy() {
          const { Component } = await import('~/routes/public-post-print');
          return {
            Component,
          };
        },
      },
    ],
    errorElement: <PublicPageError />,
  },
  // This page displays an existing post from a blog.
  {
    path: '/oldformat/:blogId/:postId',
    async lazy() {
      const { Component, loader } = await import('./old-format');
      return {
        loader: loader(queryClient),
        Component,
      };
    },
    errorElement: <PageError />,
  },
];

export const basename = import.meta.env.PROD ? '/blog' : '/';
export const baseUrl = `${location.origin}${basename.replace(/\/$/g, '')}`;

export const router = (queryClient: QueryClient) =>
  createBrowserRouter(routes(queryClient), {
    basename: basename,
  });
