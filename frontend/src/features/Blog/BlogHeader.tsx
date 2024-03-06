import { AppHeader, Breadcrumb } from "@edifice-ui/react";

import { BlogActionBar } from "./BlogActionBar";
import { Blog } from "~/models/blog";
import { basename } from "~/routes";

export interface BlogProps {
  blog: Blog;
  print?: boolean;
}

export const BlogHeader = ({ blog, print }: BlogProps) => {
  return (
    <AppHeader>
      <div className="d-flex flex-wrap flex-md-nowrap justify-content-md-between flex-fill gap-12 overflow-hidden">
        <div className="text-truncate">
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
            name={blog.title}
          />
        </div>
        {!print && <BlogActionBar blog={blog} />}
      </div>
    </AppHeader>
  );
};
