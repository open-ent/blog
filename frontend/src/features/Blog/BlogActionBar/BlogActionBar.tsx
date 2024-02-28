import { Suspense, lazy } from "react";

import { Add, Options } from "@edifice-ui/icons";
import {
  Button,
  IconButton,
  LoadingScreen,
  useToggle,
  BlogPublic,
  ShareModal,
  ShareBlog,
} from "@edifice-ui/react";
import { ACTION, ActionType } from "edifice-ts-client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ActionBarContainer } from "~/features/ActionBar/ActionBarContainer";
import { useBlogActions } from "~/features/ActionBar/useBlogActions";
import { Blog } from "~/models/blog";
import { useShareBlog, useUpdateBlog } from "~/services/queries";

export interface BlogActionBarProps {
  blog: Blog;
}

const UpdateModal = lazy(
  async () => await import("~/features/ActionBar/Resource/ResourceModal"),
);

export const BlogActionBar = ({ blog }: BlogActionBarProps) => {
  const { t } = useTranslation("blog");
  const navigate = useNavigate();

  const [isBarOpen, toggleBar] = useToggle();
  const [isUpdateModalOpen, toogleUpdateModalOpen] = useToggle();
  const [isShareModalOpen, toogleShareModalOpen] = useToggle();

  const handleAddClick = () => {
    navigate(`./post/edit`);
  };

  const handleEditClick = () => {
    toogleUpdateModalOpen();
  };

  const handleEditClose = () => {
    toogleUpdateModalOpen();
    toggleBar();
  };

  const handleDeleteClick = () => {
    console.log("delete click");
  };

  const handlePublishClick = () => {
    console.log("publish click");
  };

  const handleShareClick = () => {
    toogleShareModalOpen();
  };

  const handleShareClose = () => {
    toogleShareModalOpen();
    toggleBar();
  };

  const handlePrintClick = () => {
    console.log("print click");
  };

  const { actions: availableActions } = useBlogActions(blog);
  const updateBlog = useUpdateBlog(blog);
  const shareBlog = useShareBlog(blog);

  function isActionAvailable(action: ActionType) {
    return availableActions?.some((act) => act.id === action);
  }

  return (
    <>
      <div className="d-flex align-items-center gap-12">
        {isActionAvailable(ACTION.CREATE) && (
          <Button leftIcon={<Add />} onClick={handleAddClick}>
            {t("blog.create.post")}
          </Button>
        )}

        <IconButton
          color="primary"
          variant="outline"
          icon={<Options />}
          onClick={toggleBar}
        />

        <ActionBarContainer visible={isBarOpen}>
          {isActionAvailable(ACTION.EDIT) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handleEditClick}
            >
              {t("blog.edit.title")}
            </Button>
          ) : (
            <></>
          )}
          {isActionAvailable(ACTION.SHARE) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handleShareClick}
            >
              {t("share")}
            </Button>
          ) : (
            <></>
          )}
          {isActionAvailable(ACTION.PUBLISH) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handlePublishClick}
            >
              {t("blog.publish")}
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
          {isActionAvailable(ACTION.DELETE) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handleDeleteClick}
            >
              {t("blog.delete.blog")}
            </Button>
          ) : (
            <></>
          )}
        </ActionBarContainer>
      </div>

      <Suspense fallback={<LoadingScreen />}>
        {isUpdateModalOpen && (
          <UpdateModal
            mode="update"
            isOpen={isUpdateModalOpen}
            resourceId={blog._id}
            updateResource={updateBlog}
            onCancel={handleEditClose}
            onSuccess={handleEditClose}
          >
            {(resource, isUpdating, watch, setValue, register) =>
              isActionAvailable(ACTION.CREATE_PUBLIC) && (
                <BlogPublic
                  appCode="blog"
                  isUpdating={isUpdating}
                  resource={resource}
                  watch={watch}
                  setValue={setValue}
                  register={register}
                />
              )
            }
          </UpdateModal>
        )}
        {isShareModalOpen && (
          <ShareModal
            isOpen={isShareModalOpen}
            resourceId={blog._id}
            shareResource={shareBlog}
            onCancel={handleShareClose}
            onSuccess={handleShareClose}
          >
            {(ressource) => (
              <ShareBlog resource={ressource} updateResource={updateBlog} />
            )}
          </ShareModal>
        )}
      </Suspense>
    </>
  );
};
