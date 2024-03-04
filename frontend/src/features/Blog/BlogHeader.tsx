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
        {!print && <BlogActionBar blog={blog} />}
      </div>
    </AppHeader>
  );
};
