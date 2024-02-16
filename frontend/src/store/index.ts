import { create } from "zustand";

import { Post, PostState } from "~/models/post";
import { PostsFilters } from "~/models/postFilter";

interface State {
  postsFilters: PostsFilters;
  sidebarHighlightedPost: Post | undefined;
  postPageSize: number;
  updaters: {
    setPostsFilter: (postsFilter: PostsFilters) => void;
    setSidebarHighlightedPost: (sidebarPostSelected?: Post) => void;
    setPostPageSize: (postPageSize: number) => void;
  };
}

export const useStoreContext = create<State>()((set, get) => ({
  postsFilters: { state: PostState.PUBLISHED, search: "" },
  sidebarHighlightedPost: undefined,
  postPageSize: 0,
  updaters: {
    setPostsFilter: (postsFilters) => set({ postsFilters }),
    setSidebarHighlightedPost: (sidebarPostSelected) =>
      set({ sidebarHighlightedPost: sidebarPostSelected }),
    setPostPageSize: (postPageSize) => {
      if (get().postPageSize > postPageSize) {
        return;
      }
      set({ postPageSize });
    },
  },
}));

export const usePostsFilters = () =>
  useStoreContext((state) => state.postsFilters);

export const useSidebarHighlightedPost = () =>
  useStoreContext((state) => state.sidebarHighlightedPost);

export const usePostPageSize = () =>
  useStoreContext((state) => state.postPageSize);

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
