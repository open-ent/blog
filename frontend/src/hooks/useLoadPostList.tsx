import { useEffect } from "react";

import { PostState } from "~/models/post";
import { useBlog, usePostsList } from "~/services/queries";
import { useStoreUpdaters } from "~/store";

/** Listen for BlogErrors and trigger toasts to notify the user about them. */
export const useLoadPostList = (loadFullList: boolean = false) => {
  const { blog, publicView } = useBlog();
  const { setPostPageSize } = useStoreUpdaters();
  // Load all posts with recurcive fetchNextPage calls.
  const {
    query: { fetchNextPage, hasNextPage, isSuccess, data },
  } = usePostsList(blog?._id, PostState.PUBLISHED, false, !publicView);

  useEffect(() => {
    // Check if the second page of post is not null to set the page size. (not given by the backend)
    if (hasNextPage && data?.pageParams.includes(1) && data?.pages[0]) {
      setPostPageSize(data?.pages[0].length);
    }

    // Load at least the 2 first pages of posts to display the page.
    if (
      isSuccess &&
      hasNextPage &&
      (loadFullList ||
        (data?.pageParams?.length && data?.pageParams?.length < 2))
    ) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, isSuccess, fetchNextPage, data]);
};
