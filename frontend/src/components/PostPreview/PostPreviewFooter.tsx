/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useMemo, useState } from "react";

import { ArrowRight, MessageInfo } from "@edifice-ui/icons";
import {
  Button,
  ReactionChoice,
  ReactionModal,
  ReactionSummary,
  ViewsCounter,
  ViewsModal,
  useReactions,
  useToggle,
} from "@edifice-ui/react";
import { ViewsDetails } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import useReactionModal from "~/hooks/useReactionModal";
import useReactionSummary from "~/hooks/useReactionSummary";
import { Post } from "~/models/post";
import { loadPostViewsDetails } from "~/services/api";
import { useBlog } from "~/services/queries";
import { useBlogState } from "~/store";

export type PostPreviewFooterProps = {
  /**
   * Post to display
   */
  post: Post;
};

export const PostPreviewFooter = ({ post }: PostPreviewFooterProps) => {
  const { t } = useTranslation("blog");

  const { publicView } = useBlog();
  const { availableReactions } = useReactions("blog", "post");
  const { postsViewsCounters, postsReactionsSummary } = useBlogState();
  const { manager, creator } = useActionDefinitions([]);

  const { loadReactionDetails, setUserReactionChoice } = useReactionSummary(
    post._id,
  );
  const {
    isReactionsModalOpen,
    handleReactionOnClick,
    handleReactionModalClose,
  } = useReactionModal();

  const views = useMemo(() => {
    return postsViewsCounters?.[post._id];
  }, [post._id, postsViewsCounters]);

  // Variables for views modal
  const [viewsDetails, setViewsDetails] = useState<ViewsDetails | undefined>();
  const [viewsModalOpen, toggleViewsModalOpen] = useToggle(false);

  const loadViewsDetails = async () => {
    const details = await loadPostViewsDetails(post._id);
    setViewsDetails(details);
  };

  const handleViewsClick = async () => {
    if (!viewsDetails) {
      await loadViewsDetails();
    }
    toggleViewsModalOpen(true);
  };

  const handleViewsModalClose = useCallback(async () => {
    toggleViewsModalOpen(false);
  }, [toggleViewsModalOpen]);

  const showViews = creator || manager;
  const showReactions = !publicView;

  return (
    <div className="d-flex justify-content-between">
      <div>
        <div className="d-flex gap-4 align-items-center ">
          {showReactions && !!postsReactionsSummary?.[post._id] && (
            <>
              <ReactionSummary
                summary={postsReactionsSummary?.[post._id]}
                onClick={handleReactionOnClick}
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
          {showViews && !!views && (
            <>
              <ViewsCounter viewsCounter={views} onClick={handleViewsClick} />
              <span className="separator d-none d-md-block"></span>
              {viewsModalOpen && (
                <ViewsModal
                  viewsDetails={viewsDetails!}
                  isOpen={viewsModalOpen}
                  onModalClose={handleViewsModalClose}
                />
              )}
            </>
          )}

          {typeof post.nbComments === "number" && (
            <div className="text-gray-700 d-flex align-items-center gap-8 p-8 post-preview-comment-icon">
              <span>{post.nbComments}</span>
              <MessageInfo />
            </div>
          )}
        </div>
        {showReactions && (
          <ReactionChoice
            availableReactions={availableReactions}
            summary={postsReactionsSummary?.[post._id]}
            onChange={setUserReactionChoice}
          />
        )}
      </div>
      <Button
        variant="ghost"
        rightIcon={<ArrowRight />}
        color="secondary"
        className="align-self-end"
      >
        {t("blog.post.preview.readMore")}
      </Button>
    </div>
  );
};
