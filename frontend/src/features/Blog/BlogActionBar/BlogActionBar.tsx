import { Add, Options } from "@edifice-ui/icons";
import { Button, IconButton, useToggle } from "@edifice-ui/react";
import { ACTION, ActionType } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { ActionBarContainer } from "~/features/ActionBar/ActionBarContainer";
import { useBlogActions } from "~/features/ActionBar/useBlogActions";
import { Blog } from "~/models/blog";

export interface BlogActionBarProps {
  blog: Blog;
}

export const BlogActionBar = ({ blog }: BlogActionBarProps) => {
  const { t } = useTranslation("blog");

  const [isBarOpen, toggleBar] = useToggle();

  const handleAddClick = () => {
    console.log("add click");
  };

  const handleManageClick = () => {
    console.log("manage click");
  };

  const handleDeleteClick = () => {
    console.log("delete click");
  };

  const handlePublishClick = () => {
    console.log("publish click");
  };

  const handleShareClick = () => {
    console.log("share click");
  };

  const handlePrintClick = () => {
    console.log("print click");
  };

  const { actions: availableActions } = useBlogActions(blog!);

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
          {isActionAvailable(ACTION.MANAGE) ? (
            <Button
              type="button"
              color="primary"
              variant="filled"
              onClick={handleManageClick}
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
    </>
  );
};
