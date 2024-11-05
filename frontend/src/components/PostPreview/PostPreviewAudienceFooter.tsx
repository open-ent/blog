import { useCallback, useMemo, useState } from 'react';

import {
  ReactionModal,
  ReactionSummary,
  ViewsCounter,
  ViewsModal,
  useToggle,
} from '@edifice-ui/react';
import { ViewsDetails } from 'edifice-ts-client';

import { useActionDefinitions } from '~/features/ActionBar/useActionDefinitions';
import useReactionModal from '~/hooks/useReactionModal';
import useReactionSummary from '~/hooks/useReactionSummary';
import { Post } from '~/models/post';
import { loadPostViewsDetails } from '~/services/api';
import { useBlogState } from '~/store';

export type PostPreviewAudienceFooterProps = {
  /**
   * Post to display
   */
  post: Post;
};

export const PostPreviewAudienceFooter = ({
  post,
}: PostPreviewAudienceFooterProps) => {
  const { postsViewsCounters, postsReactionsSummary } = useBlogState();
  const { manager, creator } = useActionDefinitions([]);

  const { loadReactionDetails } = useReactionSummary(post._id);
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

  const showViews = creator || manager;

  return (
    <>
      {!!postsReactionsSummary?.[post._id] && (
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
      {showViews && views !== undefined && (
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
    </>
  );
};
