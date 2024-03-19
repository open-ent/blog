import { Suspense, lazy } from "react";

import { Button, useToggle } from "@edifice-ui/react";
import { ACTION } from "edifice-ts-client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { ActionBarContainer } from "~/features/ActionBar/ActionBarContainer";
import { usePostActions } from "~/features/ActionBar/usePostActions";
import { Blog } from "~/models/blog";
import { Post, PostState } from "~/models/post";
import { baseUrl } from "~/routes";
import { useBlogState, useStoreUpdaters } from "~/store";

const ConfirmModal = lazy(
  async () => await import("~/components/ConfirmModal/ConfirmModal"),
);

export interface PostPreviewActionBarProps {
  /**
   * Blog of the post.
   */
  blog: Blog;
  /**
   * Post to be previewed.
   */
  post: Post;
  /**
   * Index of the post in the list of posts.
   */
  index: number;
}

export const PostPreviewActionBar = ({
  blog: { _id: blogId, slug, visibility },
  post,
  index,
}: PostPreviewActionBarProps) => {
  // Get available actions and requirements for the post.
  const postActions = usePostActions(postContentActions, blogId, post);
  const { mustSubmit, isActionAvailable, goUp, publish, trash } = postActions;

  const { t } = useTranslation("blog");
  const navigate = useNavigate();

  const [isDeleteModalOpen, toggleDeleteModalOpen] = useToggle();
  const [isGoUpModalOpen, toggleGoUpModalOpen] = useToggle();

  const { setActionBarPostId } = useStoreUpdaters();
  const { actionBarPostId } = useBlogState();

  const isPublic = visibility === "PUBLIC";

  const handleEditClick = () => {
    navigate(`/id/${blogId}/post/${post._id}?edit=true`);
  };

  const handlePrintClick = () => {
    if (isPublic) {
      window.open(`${baseUrl}/pub/${slug}/print/post/${post._id}`, "_blank");
    } else {
      window.open(`${baseUrl}/print/${blogId}/post/${post._id}`, "_blank");
    }
  };

  const handlePublishClick = async () => {
    await publish();
    setActionBarPostId();
  };

  const handleDeleteSuccess = () => {
    trash();
    toggleDeleteModalOpen(false);
  };

  const handleDeleteClose = () => {
    toggleDeleteModalOpen(false);
  };

  const handleGoUpSuccess = () => {
    goUp();
    toggleGoUpModalOpen(false);
  };

  const handleGoUpClose = () => {
    toggleGoUpModalOpen(false);
  };

  return (
    <>
      <ActionBarContainer visible={actionBarPostId === post._id}>
        {isActionAvailable(ACTION.OPEN) && (
          <Button type="button" variant="filled" onClick={handleEditClick}>
            {t("blog.edit.post")}
          </Button>
        )}
        {post.state !== PostState.PUBLISHED &&
          isActionAvailable(ACTION.PUBLISH) && (
            <Button type="button" variant="filled" onClick={handlePublishClick}>
              {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
            </Button>
          )}
        {post.state === PostState.PUBLISHED &&
          isActionAvailable(ACTION.MOVE) &&
          index > 0 && (
            <Button
              type="button"
              variant="filled"
              onClick={() => toggleGoUpModalOpen()}
            >
              {t("goUp")}
            </Button>
          )}
        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={handlePrintClick}
        >
          {t("blog.print")}
        </Button>
        {!isPublic && (
          <Button
            type="button"
            color="primary"
            variant="filled"
            onClick={() => toggleDeleteModalOpen(true)}
          >
            {t("blog.delete.post")}
          </Button>
        )}
      </ActionBarContainer>

      <Suspense>
        {isDeleteModalOpen && (
          <ConfirmModal
            id="confirmDeleteModal"
            isOpen={isDeleteModalOpen}
            header={<>{t("blog.delete.post")}</>}
            body={<p className="body">{t("confirm.remove.post")}</p>}
            onSuccess={handleDeleteSuccess}
            onCancel={handleDeleteClose}
          />
        )}
        {isGoUpModalOpen && (
          <ConfirmModal
            id="confirmGoUpModal"
            isOpen={isGoUpModalOpen}
            header={<>{t("goUp")}</>}
            body={<p className="body">{t("confirm.up.post")}</p>}
            onSuccess={handleGoUpSuccess}
            onCancel={handleGoUpClose}
          />
        )}
      </Suspense>
    </>
  );
};
