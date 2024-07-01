import { useCallback, useEffect, useState } from "react";

import {
  ReactionModal,
  ReactionSummary,
  ViewsCounter,
  ViewsModal,
  useReactions,
} from "@edifice-ui/react";
import { ReactionSummaryData, ViewsDetails } from "edifice-ts-client";

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

  const [reactionsSummary, setReactionsSummary] = useState<
    ReactionSummaryData | undefined
  >();
  const {
    availableReactions,
    loadReactionSummaries,
    loadReactionDetails,
    applyReaction,
  } = useReactions("blog", "post");
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);

  const loadViews = useCallback(async () => {
    const details = await loadPostViewsDetails(post._id);
    setViewsDetails(details);
  }, [post._id, setViewsDetails]);

  const loadReactions = useCallback(async () => {
    const summary = await loadReactionSummaries([post._id]);
    setReactionsSummary(summary[post._id]);
  }, [post._id, setReactionsSummary]);

  const handleReactionOnChange = useCallback(
    async (newReaction: any) => {
      if (reactionsSummary) {
        const change = await applyReaction(
          post._id,
          newReaction,
          reactionsSummary.userReaction ?? null,
        );
        const newSummary = { ...reactionsSummary };
        switch (change) {
          case "-":
            newSummary.totalReactionsCounter--;
            newSummary.userReaction = null;
            break;
          case "+":
            newSummary.totalReactionsCounter++;
            newSummary.userReaction = newReaction;
            break;
          case "=":
            newSummary.userReaction = newReaction;
        }
        setReactionsSummary(newSummary);
      }
    },
    [applyReaction, post._id, reactionsSummary],
  );

  useEffect(() => {
    // Trigger a view once
    triggerViewOnPost(post._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    withViews && loadViews();
    loadReactions();
  }, [withViews, loadViews, loadReactions]);

  const handleViewsOnClick = () => {
    if (viewsDetails && viewsDetails.viewsCounter > 0)
      setIsViewsModalOpen(true);
  };
  const handleViewsModalClose = () => {
    setIsViewsModalOpen(false);
  };

  const handleReactionOnClick = () => {
    setIsReactionsModalOpen(true);
  };
  const handleReactionModalClose = () => {
    setIsReactionsModalOpen(false);
  };

  return (
    <div className="d-flex justify-content-between mt-32">
      <div className="d-flex gap-12 small text-gray-700 align-items-center">
        {reactionsSummary && (
          <>
            <ReactionSummary
              flexDirection="row"
              availableReactions={availableReactions}
              summary={reactionsSummary}
              onClick={handleReactionOnClick}
              onChange={handleReactionOnChange}
            />
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
