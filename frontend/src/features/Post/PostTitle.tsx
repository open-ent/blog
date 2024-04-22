import { ArrowLeft, Print, TextToSpeech } from "@edifice-ui/icons";
import { Avatar, Badge, Button, IconButton } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { PostActionBar } from "./PostActionBar";
import { PostDate } from "./PostDate";
import { PostActions } from "../ActionBar/usePostActions";
import { Post, PostState } from "~/models/post";
import { useBlog } from "~/services/queries";
import { getAvatarURL, getUserbookURL } from "~/utils/PostUtils";

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
  const { publicView } = useBlog();
  const { t } = useTranslation("blog");
  const { t: common_t } = useTranslation("common");
  const { readOnly } = postActions || {};

  if (mode === "edit") return;

  return (
    <>
      {mode !== "print" && (
        <div className="d-flex justify-content-between align-items-center my-16">
          <Button
            type="button"
            color="tertiary"
            variant="ghost"
            leftIcon={<ArrowLeft />}
            onClick={onBackward}
            size="sm"
          >
            {common_t("back")}
          </Button>
          <div className="d-flex ms-16 gap-12">
            {readOnly || publicView ? (
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
              <PostActionBar
                post={post}
                postActions={postActions}
                onEdit={onEdit}
                onDelete={onDelete}
                onPublish={onPublish}
                onPrint={onPrint}
                onTts={onTts}
              />
            )}
          </div>
        </div>
      )}

      <div className="d-flex flex-column mt-8 mx-md-8">
        <div className="d-flex align-items-center">
          <h2 className="text-gray-800">{post.title}</h2>
          {post.state === PostState.DRAFT && postActions?.showBadge && (
            <Badge
              className="ms-16 fs-6"
              variant={{
                type: "notification",
                level: "info",
                color: "text",
              }}
            >
              {t("draft")}
            </Badge>
          )}
          {post.state === PostState.SUBMITTED && postActions?.showBadge && (
            <Badge
              className="blog-post-badge ms-16 fs-6"
              variant={{
                type: "notification",
                level: "warning",
                color: "text",
              }}
            >
              {t("blog.filters.submitted")}
            </Badge>
          )}
        </div>
        <div className="d-flex align-items-center gap-12 mb-16 mb-md-24 mt-8">
          <Avatar
            alt={t("post.author.avatar")}
            size="sm"
            src={getAvatarURL(post.author.userId)}
            variant="circle"
          />
          <div className="text-gray-700 small d-flex flex-column flex-md-row column-gap-12 align-items-md-center ">
            <a
              href={getUserbookURL(post.author.userId)}
              className="comment-card-author"
            >
              {post.author.username}
            </a>
            <PostDate post={post}></PostDate>
          </div>
        </div>
      </div>
    </>
  );
};
