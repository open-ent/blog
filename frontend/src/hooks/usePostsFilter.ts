import { useSearchParams } from "react-router-dom";

import { PostState } from "~/models/post";
import { PostsFilters } from "~/models/postFilter";

function usePostsFilter(): {
  postsFilters: PostsFilters;
  setPostsFilters: (newPostsFilters: PostsFilters) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const postsFilters = {
    state: (searchParams.get("state") as PostState) || PostState.PUBLISHED,
    search: searchParams.get("search") || "",
  };

  const setPostsFilters = (newPostsFilters: PostsFilters) => {
    setSearchParams(newPostsFilters, { replace: true });
  };

  return { postsFilters, setPostsFilters };
}

export default usePostsFilter;
