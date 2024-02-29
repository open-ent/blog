import { Avatar, Badge, Button, useDate } from "@edifice-ui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { Comment } from "~/models/comment";
import { getAvatarURL } from "~/utils/PostUtils";

export interface CommentProps {
  comment: Comment;
  className?: string;
}

export const CommentCard = ({ comment, className }: CommentProps) => {
  const { t } = useTranslation("blog");
  const { fromNow } = useDate();

  return (
    <div className={clsx("border rounded-3 p-12 d-flex", className)}>
      <Avatar
        alt={t("post.author.avatar")}
        size="sm"
        src={getAvatarURL(comment)}
        variant="circle"
      />
      <div className="ms-4 d-flex flex-column">
        <div className="ms-8">
          <div className="mb-8 d-flex text-gray-700 small gap-8">
            <span className="ms-2">{comment.author.username}</span>
            <Badge
              variant={{
                type: "profile",
                profile: "teacher" /* | "student" | "relative" | "personnel"*/,
              }}
            >
              {t("teacher")}
            </Badge>
            <span className="d-none d-md-block mx-8">|</span>
            <span>
              {t("post.dated.published", { date: fromNow(comment.created) })}
            </span>
          </div>
          <div className="ms-">{comment.comment}</div>
        </div>
        <div>
          <Button variant="ghost" color="tertiary" size="sm">
            {t("blog.edit.post")}
          </Button>
          <Button variant="ghost" color="tertiary" size="sm">
            {t("blog.delete.post")}
          </Button>
        </div>
      </div>
    </div>
  );
};
