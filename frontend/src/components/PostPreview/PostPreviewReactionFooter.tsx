import { ReactionChoice, useReactions } from '@edifice-ui/react';

import useReactionSummary from '~/hooks/useReactionSummary';
import { Post } from '~/models/post';
import { useBlogState } from '~/store';

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
  const { postsReactionsSummary } = useBlogState();

  const { setUserReactionChoice } = useReactionSummary(post._id);

  return (
    <ReactionChoice
      availableReactions={availableReactions}
      summary={postsReactionsSummary?.[post._id]}
      onChange={setUserReactionChoice}
    />
  );
};
