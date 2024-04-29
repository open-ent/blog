import { useLocation, useSearchParams } from "react-router-dom";

import { PostState } from "~/models/post";
import { PostsFilters } from "~/models/postFilter";

function usePostsFilter(): {
  postsFilters: PostsFilters;
  setPostsFilters: (newPostsFilters: PostsFilters) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  // Try to find the default state from the navigation history
  const location = useLocation();
  const defaultState = location?.state?.defaultFilter ?? PostState.PUBLISHED;

  const postsFilters = {
    state: (searchParams.get("state") as PostState) || defaultState,
    search: searchParams.get("search") || "",
  };

  const setPostsFilters = (newPostsFilters: PostsFilters) => {
    if (!newPostsFilters.search) delete newPostsFilters.search;
    setSearchParams(newPostsFilters, { replace: true });
  };

  return { postsFilters, setPostsFilters };
}

export default usePostsFilter;
