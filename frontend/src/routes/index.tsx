import { QueryClient } from "@tanstack/react-query";
import { RouteObject, createBrowserRouter } from "react-router-dom";

import { ExplorerBlog } from "./explorer-blog";
import PageError from "./page-error";
import { Root } from "~/routes/root";

const routes = (queryClient: QueryClient): RouteObject[] => [
  {
    path: "/*",
    element: <Root />,
    children: [
      {
        index: true,
        async lazy() {
          const { rootLoader } = await import("~/routes/root");
          return {
            loader: rootLoader,
          };
        },

        // TODO remove cast as any when ode-explorer is fixed
        element: <ExplorerBlog />,
      },
      // This page displays all information about the blog and its list of posts.
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
      // This page displays a new blank post in edit mode, for a blog.
      {
        path: "id/:blogId/post/edit",
        async lazy() {
          const { Component, loader } = await import("~/routes/post-edit");
          return {
            loader: loader(queryClient),
            Component,
          };
        },
      },
      // This page displays an existing post from a blog.
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
  // This page allows printing a blog.
  {
    path: "/print/:blogId",
    async lazy() {
      const { BlogPrint, blogPrintLoader } = await import(
        "~/routes/blog-print"
      );
      return {
        loader: blogPrintLoader(queryClient),
        Component: BlogPrint,
      };
    },
  },
  // This page allows printing a post from a blog.
  {
    path: "/print/:blogId/post/:postId",
    async lazy() {
      const { PostPrint, postPrintLoader } = await import(
        "~/routes/post-print"
      );
      return {
        loader: postPrintLoader(queryClient),
        Component: PostPrint,
      };
    },
  },
  // This page displays a public blog.
  {
    path: "/pub/:slug",
    async lazy() {
      const { Component, loader } = await import("~/routes/blog-public");
      return {
        loader: loader(queryClient),
        Component,
      };
    },
    errorElement: <PageError />,
  },
  // This page displays an existing post from a blog.
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
];

export const basename = import.meta.env.PROD ? "/blog" : "/";
export const baseUrl = `${location.origin}${basename.replace(/\/$/g, "")}`;

export const router = (queryClient: QueryClient) =>
  createBrowserRouter(routes(queryClient), {
    basename: basename,
  });
