import { create } from "zustand";

import { Post } from "~/models/post";
import { PostsFilters } from "~/models/postFilter";

interface State {
  postsFilters: PostsFilters;
  sidebarPostSelected: Post | undefined;
  postPageSize: number;
  updaters: {
    setPostsFilter: (postsFilter: PostsFilters) => void;
    setSidebarPostSelected: (sidebarPostSelected?: Post) => void;
    setPostPageSize: (postPageSize: number) => void;
  };
}

export const useStoreContext = create<State>()((set, get) => ({
  postsFilters: { states: [], search: "" },
  sidebarPostSelected: undefined,
  postPageSize: 0,
  updaters: {
    setPostsFilter: (postsFilters) => set({ postsFilters }),
    setSidebarPostSelected: (sidebarPostSelected) =>
      set({ sidebarPostSelected }),
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

export const useSidebarPostSelected = () =>
  useStoreContext((state) => state.sidebarPostSelected);

export const usePostPageSize = () =>
  useStoreContext((state) => state.postPageSize);

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
