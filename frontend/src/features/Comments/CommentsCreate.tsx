import { useId, useRef, useState } from "react";

import { Send } from "@edifice-ui/icons";
import { Avatar, Button, useSession } from "@edifice-ui/react";
import clsx from "clsx";
import { odeServices } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { Comment } from "~/models/comment";

const MAX_COMMENT_LENGTH = 800;

export interface CommentsCreateProps {
  comments: Comment[];
}

export const CommentsCreate = ({ comments }: CommentsCreateProps) => {
  const { t } = useTranslation("blog");
  const { userId } = useSession().data;
  const inputId = useId();

  const inputRef = useRef<HTMLInputElement>(null!);
  const avatarUrl = odeServices.directory().getAvatarUrl(userId, "user");

  const [inputLength, setInputLength] = useState(0);

  const handleInputChange = () => {
    setInputLength(inputRef.current.value.length);
  };
  const headerClass = clsx(
    "px-12 py-16 d-flex gap-8",
    comments.length > 0 && "border rounded-3 bg-gray-300",
  );

  return (
    <div className={headerClass}>
      <Avatar
        alt={t("post.author.avatar")}
        size="sm"
        src={avatarUrl}
        variant="circle"
      />
      <div className="d-flex flex-column flex-fill gap-8">
        <label htmlFor={inputId}>{t("comment.placeholder")}</label>
        <div className="border rounded-3 px-16 py-12 d-flex gap-2 flex-column bg-white">
          <input
            id={inputId}
            ref={inputRef}
            className="border-0"
            maxLength={MAX_COMMENT_LENGTH}
            type="text"
            autoComplete="off"
            onChange={handleInputChange}
          />
          <div className="d-flex gap-12 justify-content-end align-items-center">
            <span className="small text-gray-700">
              {inputLength}/{MAX_COMMENT_LENGTH}
            </span>
            <Button leftIcon={<Send />} variant="ghost" size="lg">
              {t("blog.comment.post")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
