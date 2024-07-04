import { ReactionSummaryData, ViewsCounters } from "edifice-ts-client";
import { create } from "zustand";

import { Post } from "~/models/post";

export type ReactionsSummary = {
  [postId: string]: ReactionSummaryData | undefined;
};

interface State {
  sidebarHighlightedPost: Post | undefined;
  postPageSize: number;
  actionBarPostId: string | undefined;
  postsViewsCounters: ViewsCounters;
  postsReactionsSummary: ReactionsSummary;
  updaters: {
    setSidebarHighlightedPost: (sidebarPostSelected?: Post) => void;
    setPostPageSize: (postPageSize: number) => void;
    setActionBarPostId: (actionBarPostId?: string) => void;
    addPostsViewsCounters: (postsViewsCounters: ViewsCounters) => void;
    addPostsReactionsSummary: (summary: ReactionsSummary) => void;
    addPostReactionSummary: (
      summary: ReactionSummaryData,
      postId: string,
    ) => void;
  };
}

export const useStoreContext = create<State>()((set, get) => ({
  sidebarHighlightedPost: undefined,
  postPageSize: 0,
  actionBarPostId: undefined,
  postsViewsCounters: {},
  postsReactionsSummary: {},
  updaters: {
    setSidebarHighlightedPost: (sidebarPostSelected) =>
      set({ sidebarHighlightedPost: sidebarPostSelected }),
    setPostPageSize: (postPageSize) => {
      if (get().postPageSize > postPageSize) {
        return;
      }
      set({ postPageSize });
    },
    setActionBarPostId: (actionBarPostId) => set({ actionBarPostId }),
    addPostsViewsCounters: (postsViewsCounters: ViewsCounters) =>
      set({
        postsViewsCounters: {
          ...get().postsViewsCounters,
          ...postsViewsCounters,
        },
      }),
    addPostsReactionsSummary: (postsReactionsSummary: ReactionsSummary) =>
      set({
        postsReactionsSummary: {
          ...get().postsReactionsSummary,
          ...postsReactionsSummary,
        },
      }),
    addPostReactionSummary: (summary: ReactionSummaryData, postId: string) => {
      set({
        postsReactionsSummary: {
          ...get().postsReactionsSummary,
          [postId]: summary,
        },
      });
    },
  },
}));

export const useBlogState = () =>
  useStoreContext((state) => ({
    sidebarHighlightedPost: state.sidebarHighlightedPost,
    postPageSize: state.postPageSize,
    actionBarPostId: state.actionBarPostId,
    postsViewsCounters: state.postsViewsCounters,
    postsReactionsSummary: state.postsReactionsSummary,
  }));

/* Export updaters */
export const useStoreUpdaters = () =>
  useStoreContext((state) => state.updaters);
