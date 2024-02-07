import { create } from "zustand";

import { Post } from "../models/post";
import { PostsFilters } from "~/models/postFilter";

interface State {
  postsFilters: PostsFilters;
  posts: Post[];
  updaters: {
    setPostsFilter: (postsFilter: PostsFilters) => void;
    setPosts: (posts: Post[]) => void;
  };
}

export const useStoreContext = create<State>()((set) => ({
  postsFilters: { states: [], search: "" },
  posts: [],
  updaters: {
    setPostsFilter: (postsFilters) => set({ postsFilters }),
    setPosts: (posts) => set({ posts }),
  },
}));

export const usePostsFilters = () =>
  useStoreContext((state) => state.postsFilters);

export const usePosts = () => useStoreContext((state) => state.posts);

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
