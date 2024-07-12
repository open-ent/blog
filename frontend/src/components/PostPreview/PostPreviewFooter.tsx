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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const { isPublicBlog } = useBlog();
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
    return postsViewsCounters?.[post._id] | 0;
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

  const handleClickGoDetail = () => {
    navigate(`./post/${post?._id}`);
  };

  const showAudience = !isPublicBlog;
  const showViews = creator || manager;

  return (
    <div className="pt-16">
      <div className="d-flex align-items-center pb-4">
        {showAudience && !!postsReactionsSummary?.[post._id] && (
          <div className="post-footer-element">
            <ReactionSummary
              summary={postsReactionsSummary?.[post._id]}
              onClick={handleReactionOnClick}
            />
            {isReactionsModalOpen && (
              <ReactionModal
                resourceId={post._id}
                isOpen={isReactionsModalOpen}
                onModalClose={handleReactionModalClose}
                reactionDetailsLoader={loadReactionDetails}
              />
            )}
          </div>
        )}
        {showAudience && showViews && views !== undefined && (
          <div className="post-footer-element">
            <ViewsCounter viewsCounter={views} onClick={handleViewsClick} />
            {viewsModalOpen && (
              <ViewsModal
                viewsDetails={viewsDetails!}
                isOpen={viewsModalOpen}
                onModalClose={handleViewsModalClose}
              />
            )}
          </div>
        )}
        {post.nbComments !== undefined && (
          <div className="post-footer-element">
            <Button
              onClick={handleClickGoDetail}
              variant="ghost"
              className="text-gray-700 fw-normal py-4 px-8 btn-icon"
            >
              <span>{post.nbComments}</span>
              <MessageInfo />
            </Button>
          </div>
        )}
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <div className="pt-4">
          {showAudience && (
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
          className="align-self-end justify-self-end"
          onClick={handleClickGoDetail}
        >
          {t("blog.post.preview.readMore")}
        </Button>
      </div>
    </div>
  );
};
