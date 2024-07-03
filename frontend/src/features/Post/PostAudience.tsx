import { useCallback, useEffect, useState } from "react";

import {
  ReactionChoice,
  ReactionModal,
  ReactionSummary,
  ViewsCounter,
  ViewsModal,
} from "@edifice-ui/react";
import { ReactionType, ViewsDetails } from "edifice-ts-client";

import useReactionModal from "~/hooks/useReactionModal";
import useReactionSummary from "~/hooks/useReactionSummary";
import { Post } from "~/models/post";
import { loadPostViewsDetails, triggerViewOnPost } from "~/services/api";

export interface PostAudienceProps {
  blogId: string;
  post: Post;
  withViews: boolean;
}

export const PostAudience = ({
  /*blogId,*/
  post,
  withViews,
}: PostAudienceProps) => {
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

  const loadViews = useCallback(async () => {
    const details = await loadPostViewsDetails(post._id);
    setViewsDetails(details);
  }, [post._id, setViewsDetails]);

  useEffect(() => {
    // Trigger a view once
    triggerViewOnPost(post._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    withViews && loadViews();
    loadReactions();
  }, [withViews, loadViews, loadReactions]);

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
    <div className="d-flex justify-content-between">
      <div className="d-flex align-items-start align-items-md-center gap-12 small text-gray-700">
        {reactionSummary && (
          <>
            <div className="d-inline-flex flex-column-reverse flex-md-row align-items-start align-items-md-center gap-12">
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
            <span className="separator d-none d-md-block"></span>
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
        {withViews && typeof viewsDetails === "object" && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
