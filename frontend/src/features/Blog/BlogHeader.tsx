import { AppHeader, Breadcrumb, useOdeClient } from "@edifice-ui/react";

import { BlogActionBar } from "./BlogActionBar";
import { Blog } from "~/models/blog";

export interface BlogProps {
  blog: Blog;
  readonly?: boolean;
}

export const BlogHeader = ({ blog, readonly = false }: BlogProps) => {
  const { currentApp } = useOdeClient();
  return (
    <AppHeader>
      <div className="d-flex flex-column flex-md-row flex-nowrap justify-content-md-between flex-fill gap-12 overflow-hidden">
        <div className="overflow-hidden">
          {currentApp && <Breadcrumb app={currentApp} name={blog.title} />}
        </div>
        {!readonly && <BlogActionBar blog={blog} />}
      </div>
    </AppHeader>
  );
};
