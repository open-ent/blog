/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useEffect, useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { Avatar, Badge, Card, Image, useDate } from "@edifice-ui/react";
import clsx from "clsx";
import { odeServices } from "edifice-ts-client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { Post, PostState } from "~/models/post";
import { useSidebarHighlightedPost } from "~/store";

export type BlogPostCardProps = {
  /**
   * Post to display
   */
  post: Post;
};

export const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const { fromNow } = useDate();
  const { t } = useTranslation();

  const directoryService = odeServices.directory();

  const sidebarHighlightedPost = useSidebarHighlightedPost();
  const { contrib, manager, creator } = useActionDefinitions([]);
  const navigate = useNavigate();

  const editorRef = useRef<EditorRef>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [summaryContent, setSummaryContent] = useState<string>("");
  const [summaryContentPlain, setSummaryContentPlain] = useState<string>("");
  const [mediaURLs, setMediaURLs] = useState<string[]>([]);

  // Number of media to display on the preview card
  const MAX_NUMBER_MEDIA_DISPLAY = 3;

  const getAvatarURL = (post: Post): string => {
    return directoryService.getAvatarUrl(post.author.userId, "user");
  };

  const displayDate = (date: string) => {
    return fromNow(date);
  };

  const handleOnClick = (post: Post) => {
    navigate(`./post/${post?._id}`);
  };

  useEffect(() => {
    if (sidebarHighlightedPost?._id === post._id) {
      cardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [sidebarHighlightedPost, post]);

  useEffect(() => {
    let contentHTML = post.content;
    if (contentHTML) {
      const getMediaTags = /<(img|video|iframe|audio|embed)[^>]*>(<\/\1>)?/gim;
      const getSrc = /src=(?:"|')([^"|']*)(?:"|')/;
      const mediaTags = contentHTML.match(getMediaTags);
      contentHTML = contentHTML.replace(getMediaTags, "");
      if (mediaTags?.length) {
        setMediaURLs(
          mediaTags
            .filter((tag) => tag.includes("img"))
            .map((tag) => {
              const srcMatch = getSrc.exec(tag);
              return srcMatch?.length ? srcMatch[1] : "";
            }) || [],
        );
      }

      setSummaryContent(contentHTML);
    }
  }, [post]);

  useEffect(() => {
    if (editorRef.current?.getContent("plain")) {
      const plainText =
        editorRef.current
          ?.getContent("plain")
          ?.replace(/\u200B/g, "")
          ?.replace(/((&nbsp;)|\s)((&nbsp;)|\s)+/g, " ") || "";
      setSummaryContentPlain(plainText);
    }
  }, [editorRef, summaryContent]);

  const classes = clsx("p-24", {
    "blog-post-badge-highlight": post._id === sidebarHighlightedPost?._id,
  });

  return (
    <Card
      className={classes}
      onClick={() => {
        handleOnClick(post);
      }}
      ref={cardRef}
    >
      <div className="d-flex gap-12 ">
        <div className="blog-post-user-image">
          <Avatar
            alt={t("Avatar utilisateur")}
            size="md"
            src={getAvatarURL(post)}
            variant="circle"
          />
        </div>
        <div className="d-flex flex-column">
          <h5 className="d-flex align-items-center">
            {post.title}
            {post.state === PostState.DRAFT &&
              (creator || manager || contrib) && (
                <Badge
                  className="ms-8"
                  variant={{
                    type: "notification",
                    level: "info",
                    color: "text",
                  }}
                >
                  {t("Brouillon")}
                </Badge>
              )}
            {post.state === PostState.SUBMITTED && (
              <Badge
                className="blog-post-badge ms-8"
                variant={{
                  type: "notification",
                  level: "warning",
                  color: "text",
                }}
              >
                {t(creator || manager ? "À valider" : "Envoyés")}
              </Badge>
            )}
          </h5>
          <div className="text-gray-700 small gap-4 d-flex flex-column flex-md-row ">
            <div>{post.author.username}</div>
            <div className="d-none d-md-block ">|</div>
            <div>{t("Envoyé le") + " " + displayDate(post.modified.$date)}</div>
          </div>
        </div>
      </div>
      <Card.Body space="0">
        <div className="d-flex flex-fill flex-column gap-16 pt-16">
          <div className="d-none">
            <Editor
              ref={editorRef}
              content={summaryContent}
              mode="read"
              variant="ghost"
            />
          </div>
          <div className="flex-fill blog-post-preview">
            {summaryContentPlain}
          </div>
          <div className="d-flex align-items-center justify-content-around gap-24 mx-32">
            {mediaURLs.slice(0, MAX_NUMBER_MEDIA_DISPLAY).map((url, index) => (
              <div
                className={clsx("blog-post-image col-12 col-md-4 ", {
                  "d-none d-md-block": index >= 1,
                })}
                key={url}
              >
                <Image
                  alt=""
                  objectFit="cover"
                  ratio="16"
                  className="rounded"
                  src={url}
                />
                {(index === 0 || index === 2) &&
                  mediaURLs.length - (index + 1) > 0 && (
                    <div
                      className={clsx(
                        "position-absolute top-0 bottom-0 start-0 end-0 d-flex justify-content-center align-items-center rounded text-light bg-dark bg-opacity-50",
                        {
                          "d-flex d-md-none": index === 0,
                          "d-none d-md-flex": index === 2,
                        },
                      )}
                    >
                      + {mediaURLs.length - (index + 1)} {t("images")}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
