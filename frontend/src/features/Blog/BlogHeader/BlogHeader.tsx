import { AppHeader, Breadcrumb } from "@edifice-ui/react";

import { BlogActionBar } from "../BlogActionBar/BlogActionBar";
import { Blog } from "~/models/blog";
import { basename } from "~/routes";

export interface BlogProps {
  blog: Blog;
}

export const BlogHeader = ({ blog }: BlogProps) => {
  return (
    <AppHeader>
      <div className="d-flex justify-content-between flex-fill ">
        <Breadcrumb
          app={{
            address: basename,
            display: false,
            displayName: "Blog",
            icon: "",
            isExternal: false,
            name: "",
            scope: [],
          }}
          name={blog?.title}
        />
        <BlogActionBar blog={blog} />
      </div>
    </AppHeader>
  );
};
