import { QueryClient } from "@tanstack/react-query";
import { Explorer } from "ode-explorer/lib";
import { RouteObject, createBrowserRouter } from "react-router-dom";

import { explorerConfig } from "~/config/config";
import Root from "~/routes/root";

const routes = (queryClient: QueryClient): RouteObject[] => [
  {
    path: "/",
    element: <Root />,
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
    //FIXME errorElement: <ErrorPage />,
  },
];

export const router = (queryClient: QueryClient) =>
  createBrowserRouter(routes(queryClient), {
    basename: import.meta.env.PROD ? "/blog" : "/",
  });
