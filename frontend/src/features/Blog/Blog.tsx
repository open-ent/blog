import { LoadingScreen, useTrashedResource } from "@edifice-ui/react";

import { BlogFilter } from "./BlogFilter";
import { BlogHeader } from "~/features/Blog/BlogHeader";
import BlogPostList from "~/features/Blog/BlogPostList";
import BlogSidebar from "~/features/Blog/BlogSidebar";
import { useBlogErrorToast } from "~/hooks/useBlogErrorToast";
import { useLoadPostList } from "~/hooks/useLoadPostList";
import { useBlog, useBlogCounter } from "~/services/queries";

// loader : See the public-portal loader

export function Blog() {
  useBlogErrorToast();
  const { blog, publicView } = useBlog();
  useTrashedResource(blog?._id);
  const { counters } = useBlogCounter();

  useLoadPostList();

  if (!blog) return <LoadingScreen />;

  return (
    <>
      <BlogHeader blog={blog} readonly={publicView} />
      <div className="d-flex flex-fill">
        <BlogSidebar />
        <div className="flex-fill py-16 ps-md-16 d-flex flex-column">
          {!publicView && !!counters?.countAll && <BlogFilter blog={blog} />}
          <BlogPostList />
        </div>
      </div>
    </>
  );
}
