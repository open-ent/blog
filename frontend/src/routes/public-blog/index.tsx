import { useEffect } from "react";

import { LoadingScreen } from "@edifice-ui/react";

import { BlogHeader } from "~/features/Blog/BlogHeader";
import BlogPostList from "~/features/Blog/BlogPostList";
import BlogSidebar from "~/features/Blog/BlogSidebar";
import { PostState } from "~/models/post";
import { useBlog, usePostsList } from "~/services/queries";
import { useStoreUpdaters } from "~/store";

// loader : See the public-portal loader

export function Component() {
  const { blog } = useBlog();
  const { setPostPageSize } = useStoreUpdaters();
  // Load all posts with recurcive fetchNextPage calls.
  const {
    query: { fetchNextPage, hasNextPage, isSuccess, data },
  } = usePostsList(blog?._id, PostState.PUBLISHED, false, true);

  useEffect(() => {
    // Check if the second page of post is not null to set the page size. (not given by the backend)
    if (hasNextPage && data?.pageParams.includes(1) && data?.pages[0]) {
      setPostPageSize(data?.pages[0].length);
    }

    // Load at least the 2 first pages of posts to display the page.
    if (
      isSuccess &&
      hasNextPage &&
      data?.pageParams?.length &&
      data?.pageParams?.length < 2
    ) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, isSuccess, fetchNextPage, data]);

  if (!blog) return <LoadingScreen />;

  return (
    <main className="container-fluid d-flex flex-column bg-white">
      <BlogHeader blog={blog} />
      <div className="d-flex flex-fill">
        <BlogSidebar />
        <div className="flex-fill py-16 ps-md-16 d-flex flex-column">
          <BlogPostList blogId={blog?._id} isPublic={true} />
        </div>
      </div>
    </main>
  );
}
