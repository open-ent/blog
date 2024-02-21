import { QueryClient } from "@tanstack/react-query";
import { Explorer } from "ode-explorer/lib";
import { RouteObject, createBrowserRouter } from "react-router-dom";

import PageError from "./page-error";
import { explorerConfig } from "~/config/config";

const routes = (queryClient: QueryClient): RouteObject[] => [
  {
    path: "/",
    async lazy() {
      const { Root, rootLoader } = await import("~/routes/root");
      return {
        loader: rootLoader(),
        Component: Root,
      };
    },
    children: [
      {
        index: true,

        // TODO remove cast as any when ode-explorer is fixed
        element: <Explorer config={explorerConfig as any} />,
      },
      // View is the page containing the blog view with all information about the blog and a list of posts
      {
        path: "id/:blogId",
        async lazy() {
          const { Blog, blogLoader } = await import("~/routes/blog");
          return {
            loader: blogLoader(queryClient),
            Component: Blog,
          };
        },
      },
      // Post is the page containing a specific post from a blog
      {
        path: "id/:blogId/post/:postId",
        async lazy() {
          const { Component, loader } = await import("~/routes/post");
          return {
            loader: loader(queryClient),
            Component,
          };
        },
      },
    ],
    errorElement: <PageError />,
  },
  {
    path: "/oldformat/:blogId/:postId",
    async lazy() {
      const { Component, loader } = await import("./old-format");
      return {
        loader: loader(queryClient),
        Component,
      };
    },
    errorElement: <PageError />,
  },
  {
    path: "/*",
    async lazy() {
      const { loader } = await import("./redirect");
      return {
        loader,
      };
    },
    errorElement: <PageError />,
  },
];

export const router = (queryClient: QueryClient) =>
  createBrowserRouter(routes(queryClient), {
    basename: import.meta.env.PROD ? "/blog" : "/",
  });
