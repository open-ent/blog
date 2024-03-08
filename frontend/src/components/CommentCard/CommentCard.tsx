import { useMemo, useState } from "react";

import { Content, EditorContent, useCommentEditor } from "@edifice-ui/editor";
import { Send } from "@edifice-ui/icons";
import { Avatar, Badge, Button, CoreDate, useDate } from "@edifice-ui/react";
import clsx from "clsx";
import { ID, IUserDescription } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { getAvatarURL, getUserbookURL } from "~/utils/PostUtils";

const MAX_COMMENT_LENGTH = 800;

export interface CommentProps {
  className?: string;
  mode: "edit" | "read" | "print";

  author: {
    userId: ID;
    username: string;
    profiles?: IUserDescription["profiles"];
  };

  created?: CoreDate;

  content?: Content;

  onRemove?: () => void;
  onPublish?: (content: Content) => void;
}

export const CommentCard = ({
  author,
  created,
  content,
  mode,
  className,
  onPublish,
  onRemove,
}: CommentProps) => {
  const [editable, setEditable] = useState(mode === "edit");

  const { t } = useTranslation("common");
  const { fromNow } = useDate();
  const { editor, commentLength, getComment, resetComment } = useCommentEditor(
    editable,
    content ?? "",
    MAX_COMMENT_LENGTH,
  );
  const badge = useMemo(() => {
    const profile = author.profiles?.[0] ?? "Guest";
    if (["Teacher", "Student", "Relative", "Personnel"].indexOf(profile) < 0)
      return <></>;

    return (
      <Badge
        variant={{
          type: "profile",
          //@ts-ignore -- Checked above
          profile: profile.toLowerCase(),
        }}
      >
        {t(profile)}
      </Badge>
    );
  }, [author.profiles, t]);

  if (!editor) return <></>;

  // Modifying an existing comment ? Truthy if yes, falsy if creating a new one.
  const modifying = content !== undefined;

  const handleEditClick = () => setEditable(true);

  const handleRemoveClick = () => onRemove?.();

  const handlePublishClick = () => {
    onPublish?.(getComment());
    resetComment();
    setEditable(mode === "edit");
  };

  const handleCancelClick = () => {
    resetComment();
    setEditable(mode === "edit");
  };

  return (
    <div className={clsx("border rounded-3 p-12 pb-8 d-flex", className)}>
      <Avatar
        alt={t("comment.author.avatar")}
        size="sm"
        src={getAvatarURL(author.userId)}
        variant="circle"
      />
      <div className="d-flex flex-column flex-grow-1">
        <div className="ms-8 text-break">
          {editable ? (
            <div className="d-flex flex-column flex-fill gap-8">
              <div>{t("comment.placeholder")}</div>
              <div className="border rounded-3 px-16 pt-12 pb-8 d-flex gap-2 flex-column bg-white">
                <EditorContent editor={editor}></EditorContent>
                <div className="d-flex gap-12 justify-content-end align-items-center">
                  <span className="small text-gray-700">
                    {commentLength} / {MAX_COMMENT_LENGTH}
                  </span>
                  {modifying && (
                    <Button
                      variant="ghost"
                      color="tertiary"
                      size="sm"
                      onClick={handleCancelClick}
                    >
                      {t("cancel")}
                    </Button>
                  )}
                  <Button
                    leftIcon={<Send />}
                    variant="ghost"
                    size="sm"
                    onClick={handlePublishClick}
                  >
                    {t("comment.post")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ms-4">
              <div className="mb-8 d-flex text-gray-700 small gap-8">
                <a
                  href={getUserbookURL(author.userId)}
                  className="comment-card-author"
                >
                  {author.username}
                </a>
                {badge}
                {created && (
                  <>
                    <span className="d-none d-md-block mx-4 d-none d-md-block mx-4 border border-top-0 border-end-0 border-bottom-0 border-gray-600"></span>
                    <span>
                      {t("comment.publish.date", { date: fromNow(created) })}
                    </span>
                  </>
                )}
              </div>
              <EditorContent className="mb-4" editor={editor}></EditorContent>
            </div>
          )}
        </div>

        {mode !== "print" && !editable && (
          <div className="ms-4">
            {onPublish && (
              <Button
                variant="ghost"
                color="tertiary"
                size="sm"
                onClick={handleEditClick}
              >
                {t("edit")}
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                color="tertiary"
                size="sm"
                onClick={handleRemoveClick}
              >
                {t("remove")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
