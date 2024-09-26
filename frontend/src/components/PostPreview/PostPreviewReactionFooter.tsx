import { ReactionChoice, useReactions } from '@edifice-ui/react';

import useReactionSummary from '~/hooks/useReactionSummary';
import { Post } from '~/models/post';
import { useBlogStore } from '~/store';

export type PostPreviewReactionFooterProps = {
  /**
   * Post to display
   */
  post: Post;
};

export const PostPreviewReactionFooter = ({
  post,
}: PostPreviewReactionFooterProps) => {
  const { availableReactions } = useReactions('blog', 'post');
  const postsReactionsSummary = useBlogStore(
    (state) => state.postsReactionsSummary,
  );

  const { setUserReactionChoice } = useReactionSummary(post._id);

  return (
    <ReactionChoice
      availableReactions={availableReactions}
      summary={postsReactionsSummary?.[post._id]}
      onChange={setUserReactionChoice}
    />
  );
};
