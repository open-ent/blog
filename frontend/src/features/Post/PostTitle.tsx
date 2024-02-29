import { Suspense, lazy, useState } from "react";

import {
  ArrowLeft,
  Edit,
  Options,
  Print,
  TextToSpeech,
} from "@edifice-ui/icons";
import {
  Avatar,
  Button,
  IconButton,
  useDate,
  useToggle,
} from "@edifice-ui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { ActionBarContainer } from "../ActionBar/ActionBarContainer";
import { PostActions } from "../ActionBar/usePostActions";
import { Post } from "~/models/post";
import { getAvatarURL, getDatedKey } from "~/utils/PostUtils";

const ConfirmModal = lazy(
  async () => await import("~/components/ConfirmModal/ConfirmModal"),
);

export interface PostTitleProps {
  post: Post;
  postActions?: PostActions;
  mode: "edit" | "read" | "print";
  isSpeeching?: boolean;
  onBackward?: () => void;
  onPrint?: () => void;
  onTts?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
}

export const PostTitle = ({
  post,
  postActions,
  mode,
  isSpeeching,
  onBackward,
  onPrint,
  onTts,
  onEdit,
  onPublish,
  onDelete,
}: PostTitleProps) => {
  const { t } = useTranslation("blog");
  const { t: common_t } = useTranslation("common");
  const { fromNow } = useDate();
  const { mustSubmit, readOnly, canPublish } = postActions || {};

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [isBarOpen, toggleBar] = useToggle();

  if (mode === "edit") return;

  const getDatedState = (post: Post): string =>
    t(getDatedKey(post.state), { date: fromNow(post.modified.$date) });

  const classes = clsx("d-flex flex-column", {
    "mx-16": mode === "print",
    "mx-md-16 mx-lg-64": mode !== "print",
  });

  return (
    <>
      {mode !== "print" && (
        <div className="d-flex justify-content-between align-items-center mx-lg-48">
          <Button
            type="button"
            color="tertiary"
            variant="ghost"
            leftIcon={<ArrowLeft />}
            onClick={onBackward}
          >
            {common_t("back")}
          </Button>
          <div className="d-flex m-16 gap-12">
            {readOnly ? (
              <>
                <IconButton
                  icon={<Print />}
                  color="primary"
                  variant="outline"
                  aria-label={t("print")}
                  onClick={onPrint}
                />
                <IconButton
                  icon={<TextToSpeech />}
                  color="primary"
                  variant="outline"
                  className={isSpeeching ? "bg-secondary" : ""}
                  aria-label={t("tiptap.toolbar.tts")}
                  onClick={onTts}
                />
              </>
            ) : (
              <>
                <Button leftIcon={<Edit />} onClick={onEdit}>
                  {common_t("edit")}
                </Button>

                <IconButton
                  variant="outline"
                  icon={<Options />}
                  onClick={toggleBar}
                />

                <ActionBarContainer visible={isBarOpen}>
                  {canPublish ? (
                    <Button type="button" variant="filled" onClick={onPublish}>
                      {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
                    </Button>
                  ) : (
                    <></>
                  )}

                  <Button
                    type="button"
                    color="primary"
                    variant="filled"
                    onClick={onPrint}
                  >
                    {t("blog.print")}
                  </Button>

                  <Button
                    type="button"
                    color="primary"
                    variant="filled"
                    onClick={() => setConfirmDeleteModal(true)}
                  >
                    {t("blog.delete.post")}
                  </Button>
                </ActionBarContainer>
              </>
            )}
          </div>
        </div>
      )}

      <div className={classes}>
        <h2>{post.title}</h2>
        <div className="d-flex align-items-center gap-12 my-16 mt-md-8">
          <Avatar
            alt={t("post.author.avatar")}
            size="sm"
            src={getAvatarURL(post)}
            variant="circle"
          />
          <div className="text-gray-700 small gap-2 d-flex flex-column flex-md-row">
            <span>{post.author.username}</span>
            <span className="d-none d-md-block mx-8">&nbsp;|&nbsp;</span>
            <span>{getDatedState(post)}</span>
          </div>
        </div>
      </div>

      <Suspense>
        {confirmDeleteModal && (
          <ConfirmModal
            id="confirmDeleteModal"
            isOpen={confirmDeleteModal}
            header={<>{t("blog.delete.post")}</>}
            body={<p className="body">{t("confirm.remove.post")}</p>}
            onSuccess={onDelete}
            onCancel={() => setConfirmDeleteModal(false)}
          />
        )}
      </Suspense>
    </>
  );
};
