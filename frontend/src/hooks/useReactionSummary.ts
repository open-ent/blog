import { useCallback, useMemo } from 'react';

import { useReactions } from '@edifice-ui/react';
import { useShallow } from 'zustand/react/shallow';

import { useBlogStore } from '~/store';

function useReactionSummary(postId: string) {
  const {
    addPostReactionSummary,
    addPostsReactionsSummary,
    postsReactionsSummary,
  } = useBlogStore(
    useShallow((state) => ({
      postsReactionsSummary: state.postsReactionsSummary,
      addPostsReactionsSummary: state.addPostsReactionsSummary,
      addPostReactionSummary: state.addPostReactionSummary,
    })),
  );

  const {
    availableReactions,
    loadReactionSummaries,
    loadReactionDetails,
    applyReaction,
  } = useReactions('blog', 'post');

  const reactionSummary = useMemo(() => {
    return postsReactionsSummary?.[postId] ?? undefined;
  }, [postId, postsReactionsSummary]);

  const loadReactions = useCallback(
    async (force?: boolean) => {
      if (!postsReactionsSummary?.[postId] || force) {
        const summary = await loadReactionSummaries([postId]);
        addPostsReactionsSummary(summary);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [postsReactionsSummary],
  );

  const setUserReactionChoice = useCallback(
    async (newReaction: any) => {
      if (reactionSummary) {
        const oldReaction = reactionSummary.userReaction ?? null;
        const change = await applyReaction(postId, newReaction, oldReaction);
        const newSummary = { ...reactionSummary };
        switch (change) {
          case '-':
            newSummary.totalReactionsCounter--;
            newSummary.userReaction = null;
            break;
          case '+':
            newSummary.totalReactionsCounter++;
            newSummary.userReaction = newReaction;
            break;
          case '=':
            newSummary.userReaction = newReaction;
        }
        addPostReactionSummary(newSummary, postId);
        loadReactions(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyReaction, postId, reactionSummary],
  );

  return {
    availableReactions,
    reactionSummary,
    loadReactions,
    loadReactionSummaries,
    loadReactionDetails,
    setUserReactionChoice,
  };
}

export default useReactionSummary;
