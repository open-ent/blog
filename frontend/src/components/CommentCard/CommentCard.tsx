import { useMemo, useRef, useState } from "react";

import { Content } from "@edifice-ui/editor";
import { Send } from "@edifice-ui/icons";
import {
  Avatar,
  Badge,
  Button,
  CoreDate,
  FormControl,
  TextArea,
  useDate,
} from "@edifice-ui/react";
import clsx from "clsx";
import { ID, IUserDescription } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { ButtonGroup } from "../ButtonGroup/ButtonGroup";
import { getAvatarURL } from "~/utils/PostUtils";

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

  content?: string;

  onRemove?: () => void;
  onPublish?: (content: Content) => void;
}

export const CommentCard = ({
  author,
  created,
  content = "",
  mode,
  className,
  onPublish,
  onRemove,
}: CommentProps) => {
  const [editable, setEditable] = useState(mode === "edit");
  const [comment, setComment] = useState(content);
  const refTextArea = useRef<HTMLTextAreaElement>(null);

  const { t } = useTranslation("common");
  const { fromNow } = useDate();
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

  // Modifying an existing comment ? Truthy if yes, falsy if creating a new one.
  const modifying = content !== undefined;

  const handleEditClick = () => setEditable(true);

  const handleRemoveClick = () => onRemove?.();

  const handlePublishClick = () => {
    onPublish?.(comment);
    if (refTextArea.current) {
      refTextArea.current.value = "";
    }
    setEditable(mode === "edit");
    if (!content.length) {
      setComment("");
    }
  };

  const handleCancelClick = () => {
    setComment(content);
    setEditable(mode === "edit");
  };

  const cssClasses = clsx("border rounded-3 p-12 pb-8 d-flex", className, {
    "bg-gray-200": mode === "edit",
  });

  return (
    <div className={cssClasses}>
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
                <FormControl id="comment" isRequired>
                  <TextArea
                    size="sm"
                    ref={refTextArea}
                    className="border-0 bg-transparent text-break"
                    maxLength={MAX_COMMENT_LENGTH}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></TextArea>
                </FormControl>
                <ButtonGroup className="gap-12" variant="reverse">
                  <span className="small text-gray-700">
                    {comment.length} / {MAX_COMMENT_LENGTH}
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
                    disabled={!comment.length}
                  >
                    {t("comment.post")}
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          ) : (
            <div className="ms-4">
              <div className="mb-8 d-flex flex-column flex-md-row text-gray-700 small column-gap-12 align-items-md-center">
                <div className="comment-card-author">{author.username}</div>
                {badge}
                {created && (
                  <>
                    <span className="separator d-none d-md-block"></span>
                    <span>
                      {t("comment.publish.date", { date: fromNow(created) })}
                    </span>
                  </>
                )}
              </div>
              <div className="comment-card-content">{content}</div>
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
