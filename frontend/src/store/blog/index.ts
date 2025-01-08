import { ReactionSummaryData, ViewsCounters } from '@edifice.io/client';
import { create } from 'zustand';

import { Post } from '~/models/post';

export type ReactionsSummary = {
  [postId: string]: ReactionSummaryData | undefined;
};

interface State {
  sidebarHighlightedPost: Post | undefined;
  postPageSize: number;
  actionBarPostId: string | undefined;
  postsViewsCounters: ViewsCounters;
  postsReactionsSummary: ReactionsSummary;
}
interface Action {
  setSidebarHighlightedPost: (sidebarPostSelected?: Post) => void;
  setPostPageSize: (postPageSize: number) => void;
  setActionBarPostId: (actionBarPostId?: string) => void;
  addPostsViewsCounters: (postsViewsCounters: ViewsCounters) => void;
  addPostsReactionsSummary: (summary: ReactionsSummary) => void;
  addPostReactionSummary: (
    summary: ReactionSummaryData,
    postId: string,
  ) => void;
}

export const useBlogStore = create<State & Action>()((set, get) => ({
  sidebarHighlightedPost: undefined,
  postPageSize: 0,
  actionBarPostId: undefined,
  postsViewsCounters: {},
  postsReactionsSummary: {},
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
}));
