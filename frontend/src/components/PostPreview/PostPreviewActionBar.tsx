import { Suspense, lazy } from "react";

import { Button, useToggle } from "@edifice-ui/react";
import { ACTION } from "edifice-ts-client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { ActionBarContainer } from "~/features/ActionBar/ActionBarContainer";
import { usePostActions } from "~/features/ActionBar/usePostActions";
import { Post, PostState } from "~/models/post";
import { useBlogState, useStoreUpdaters } from "~/store";

const DeleteModal = lazy(
  async () => await import("~/components/ConfirmModal/ConfirmModal"),
);

export interface PostPreviewActionBarProps {
  /**
   * Blog id of the post.
   */
  blogId: string;
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
  blogId,
  post,
  index,
}: PostPreviewActionBarProps) => {
  // Get available actions and requirements for the post.
  const postActions = usePostActions(postContentActions, blogId, post);
  const { mustSubmit, isActionAvailable, goUp, publish, trash } = postActions;

  const { t } = useTranslation("blog");
  const navigate = useNavigate();

  const [isDeleteModalOpen, toogleDeleteModalOpen] = useToggle();

  const { setActionBarPostId } = useStoreUpdaters();
  const { actionBarPostId } = useBlogState();

  const handleEditClick = () => {
    navigate(`/id/${blogId}/post/${post._id}?edit=true`);
  };

  const handlePrintClick = () => {
    window.open(`/print/${blogId}/post/${post._id}`, "_blank");
  };

  const handlePublishClick = async () => {
    await publish();
    setActionBarPostId();
  };

  const handleDeleteSuccess = () => {
    trash();
    toogleDeleteModalOpen(false);
  };

  const handleDeleteClose = () => {
    toogleDeleteModalOpen(false);
  };

  return (
    <>
      <ActionBarContainer visible={actionBarPostId === post._id}>
        {isActionAvailable(ACTION.OPEN) ? (
          <Button type="button" variant="filled" onClick={handleEditClick}>
            {t("blog.edit.post")}
          </Button>
        ) : (
          <></>
        )}
        {post.state !== PostState.PUBLISHED &&
        isActionAvailable(ACTION.PUBLISH) ? (
          <Button type="button" variant="filled" onClick={handlePublishClick}>
            {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
          </Button>
        ) : (
          <></>
        )}
        {post.state === PostState.PUBLISHED &&
        isActionAvailable(ACTION.MOVE) &&
        index > 0 ? (
          <Button type="button" variant="filled" onClick={goUp}>
            {t("goUp")}
          </Button>
        ) : (
          <></>
        )}
        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={handlePrintClick}
        >
          {t("blog.print")}
        </Button>
        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={() => toogleDeleteModalOpen(true)}
        >
          {t("blog.delete.post")}
        </Button>
      </ActionBarContainer>

      <Suspense>
        {isDeleteModalOpen && (
          <DeleteModal
            id="confirmDeleteModal"
            isOpen={isDeleteModalOpen}
            header={<>{t("blog.delete.post")}</>}
            body={<p className="body">{t("confirm.remove.post")}</p>}
            onSuccess={handleDeleteSuccess}
            onCancel={handleDeleteClose}
          />
        )}
      </Suspense>
    </>
  );
};
