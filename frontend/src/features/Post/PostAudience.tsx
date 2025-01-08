import { useCallback, useEffect, useState } from 'react';

import { ReactionType, ViewsDetails } from '@edifice.io/client';
import {
  ReactionChoice,
  ReactionModal,
  ReactionSummary,
  ViewsCounter,
  ViewsModal,
} from '@edifice.io/react/audience';

import useReactionModal from '~/hooks/useReactionModal';
import useReactionSummary from '~/hooks/useReactionSummary';
import { Post } from '~/models/post';
import { loadPostViewsDetails, triggerViewOnPost } from '~/services/api';
import { useBlogStore } from '~/store';

export interface PostAudienceProps {
  post: Post;
  withViews: boolean;
}

export const PostAudience = ({ post, withViews }: PostAudienceProps) => {
  // Variables for read mode
  const [viewsDetails, setViewsDetails] = useState<ViewsDetails | undefined>();
  const [isViewsModalOpen, setIsViewsModalOpen] = useState(false);
  const {
    availableReactions,
    reactionSummary,
    loadReactions,
    loadReactionDetails,
    setUserReactionChoice,
  } = useReactionSummary(post._id);
  const {
    isReactionsModalOpen,
    handleReactionOnClick,
    handleReactionModalClose,
  } = useReactionModal();
  const addPostsViewsCounters = useBlogStore(
    (state) => state.addPostsViewsCounters,
  );

  const loadViews = useCallback(async () => {
    const details = await loadPostViewsDetails(post._id);
    console.log({ details });
    setViewsDetails(details);
    if (details) {
      addPostsViewsCounters({ [post._id]: details.viewsCounter });
    }
  }, [post._id, addPostsViewsCounters]);

  useEffect(() => {
    // Trigger a view once
    triggerViewOnPost(post._id);
    loadReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    withViews && loadViews();
  }, [loadViews, withViews]);

  const handleReactionChoiceOnChange = useCallback(
    async (choice?: ReactionType) => {
      // Update summary
      await setUserReactionChoice(choice);
      loadReactions();
    },
    [loadReactions, setUserReactionChoice],
  );

  const handleViewsOnClick = () => {
    if (viewsDetails && viewsDetails.viewsCounter > 0)
      setIsViewsModalOpen(true);
  };
  const handleViewsModalClose = () => {
    setIsViewsModalOpen(false);
  };

  return (
    <div
      className="d-flex justify-content-end mt-24 align-self-start grid-col-2 g-start-2"
      style={{
        gridRowStart: 1,
      }}
    >
      <div className="d-flex justify-content-between">
        <div className="d-flex align-items-start align-items-md-center small text-gray-700">
          {reactionSummary && (
            <>
              <div className="d-inline-flex flex-row align-items-center gap-12 post-footer-element">
                <ReactionChoice
                  availableReactions={availableReactions}
                  summary={reactionSummary}
                  onChange={handleReactionChoiceOnChange}
                />
                <ReactionSummary
                  summary={reactionSummary}
                  onClick={handleReactionOnClick}
                />
              </div>
              {isReactionsModalOpen && (
                <ReactionModal
                  resourceId={post._id}
                  isOpen={isReactionsModalOpen}
                  onModalClose={handleReactionModalClose}
                  reactionDetailsLoader={loadReactionDetails}
                />
              )}
            </>
          )}
          {withViews && typeof viewsDetails === 'object' && (
            <div className="post-footer-element">
              <ViewsCounter
                viewsCounter={viewsDetails.viewsCounter}
                onClick={handleViewsOnClick}
              />
              {isViewsModalOpen && (
                <ViewsModal
                  viewsDetails={viewsDetails}
                  isOpen={isViewsModalOpen}
                  onModalClose={handleViewsModalClose}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
