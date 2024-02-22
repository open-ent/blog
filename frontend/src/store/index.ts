import { create } from "zustand";

import { Post } from "~/models/post";

interface State {
  sidebarHighlightedPost: Post | undefined;
  postPageSize: number;
  updaters: {
    setSidebarHighlightedPost: (sidebarPostSelected?: Post) => void;
    setPostPageSize: (postPageSize: number) => void;
  };
}

export const useStoreContext = create<State>()((set, get) => ({
  sidebarHighlightedPost: undefined,
  postPageSize: 0,
  updaters: {
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

export const useSidebarHighlightedPost = () =>
  useStoreContext((state) => state.sidebarHighlightedPost);

export const usePostPageSize = () =>
  useStoreContext((state) => state.postPageSize);

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
