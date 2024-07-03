/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useEffect, useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { ArrowRight, MessageInfo } from "@edifice-ui/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Image,
  ReactionChoice,
  ReactionModal,
  ReactionSummary,
  ViewsCounter,
  ViewsModal,
  getThumbnail,
  useToggle,
} from "@edifice-ui/react";
import clsx from "clsx";
import { ReactionSummaryData, ViewsDetails } from "edifice-ts-client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PostPreviewActionBar } from "./PostPreviewActionBar";
import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { PostDate } from "~/features/Post/PostDate";
import useReactionModal from "~/hooks/useReactionModal";
import useReactionSummary from "~/hooks/useReactionSummary";
import { Post, PostState } from "~/models/post";
import { loadPostViewsDetails } from "~/services/api";
import { useBlog } from "~/services/queries";
import { useBlogState, useStoreUpdaters } from "~/store";
import { getAvatarURL } from "~/utils/PostUtils";

export type PostPreviewProps = {
  /**
   * Post to display
   */
  post: Post;
  /**
   * Index of the post in the list
   */
  index: number;
  /**
   * (optional) Views counter
   */
  views?: number;
  /**
   * (optional) Reactions summary
   */
  reactions?: {
    available: Array<"REACTION_1" | "REACTION_2" | "REACTION_3" | "REACTION_4">;
    summary: ReactionSummaryData | undefined;
  };
};

export const PostPreview = ({
  post,
  index,
  views,
  reactions,
}: PostPreviewProps) => {
  const { t } = useTranslation("blog");
  const navigate = useNavigate();

  const { blog, publicView } = useBlog();
  const { contrib, manager, creator } = useActionDefinitions([]);
  const { setActionBarPostId } = useStoreUpdaters();
  const { sidebarHighlightedPost, actionBarPostId } = useBlogState();

  const { loadReactionDetails, handleReactionOnChange } = useReactionSummary(
    post._id,
    reactions?.summary,
  );
  const {
    isReactionsModalOpen,
    handleReactionOnClick,
    handleReactionModalClose,
  } = useReactionModal();

  const editorRef = useRef<EditorRef>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [summaryContent, setSummaryContent] = useState<string>("");
  const [summaryContentPlain, setSummaryContentPlain] = useState<string>("");
  const [mediaURLs, setMediaURLs] = useState<string[]>([]);

  // Variables for views modal
  const [viewsDetails, setViewsDetails] = useState<ViewsDetails | undefined>();
  const [viewsModalOpen, toggleViewsModalOpen] = useToggle(false);

  // Number of media to display on the preview card
  const MAX_NUMBER_MEDIA_DISPLAY = 3;

  const handleCardClick = () => {
    navigate(`./post/${post?._id}`);
  };

  const handleCardSelect = useCallback(() => {
    if (actionBarPostId === post._id) {
      setActionBarPostId();
    } else {
      setActionBarPostId(post._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionBarPostId]);

  const loadViewsDetails = async () => {
    const details = await loadPostViewsDetails(post._id);
    setViewsDetails(details);
  };

  const handleViewsClick = async () => {
    if (!viewsDetails) {
      await loadViewsDetails();
    }
    toggleViewsModalOpen(true);
  };

  const handleViewsModalClose = useCallback(async () => {
    toggleViewsModalOpen(false);
  }, [toggleViewsModalOpen]);

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
              if (srcMatch?.length) {
                return getThumbnail(srcMatch[1], 0, 300);
              }
              return "";
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

  const showViews = creator || manager;
  const showReactions = !publicView;

  return (
    <>
      <Card
        className={classes}
        isSelected={actionBarPostId === post._id}
        onSelect={() => {
          handleCardSelect();
        }}
        isSelectable={true}
        ref={cardRef}
        isClickable={false}
      >
        <div
          onClick={() => {
            handleCardClick();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="d-flex gap-12">
            <div className="blog-post-user-image">
              <Avatar
                alt={t("blog.author.avatar")}
                size="md"
                src={getAvatarURL(post.author.userId)}
                variant="circle"
              />
            </div>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center">
                <h4 className="post-preview-title">{post.title}</h4>
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
                      {t("draft")}
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
                    {t("blog.filters.submitted")}
                  </Badge>
                )}
              </div>
              <div className="text-gray-700 small column-gap-12 d-flex flex-column flex-md-row align-items-md-center">
                <span>{post.author.username}</span>
                <PostDate post={post} shortDisplay={true}></PostDate>
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
              <div className="flex-fill text-truncate text-truncate-2 post-preview-content">
                {summaryContentPlain}
              </div>
              <div className="d-flex align-items-center justify-content-center gap-24 mx-32">
                {mediaURLs
                  .slice(0, MAX_NUMBER_MEDIA_DISPLAY)
                  .map((url, index) => (
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
                            + {mediaURLs.length - (index + 1)}{" "}
                            {t("post.preview.media")}
                          </div>
                        )}
                    </div>
                  ))}
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="d-flex gap-4 align-items-center ">
                    {showReactions && typeof reactions?.summary === "object" ? (
                      <>
                        <ReactionSummary
                          summary={reactions.summary}
                          onClick={handleReactionOnClick}
                        />
                        <span className="separator d-none d-md-block"></span>
                        {isReactionsModalOpen && (
                          <ReactionModal
                            resourceId={post._id}
                            isOpen={isReactionsModalOpen}
                            onModalClose={handleReactionModalClose}
                            reactionDetailsLoader={loadReactionDetails}
                          />
                        )}
                      </>
                    ) : null}
                    {showViews && typeof views === "number" ? (
                      <>
                        <ViewsCounter
                          viewsCounter={views}
                          onClick={handleViewsClick}
                        />
                        <span className="separator d-none d-md-block"></span>
                        {viewsModalOpen && (
                          <ViewsModal
                            viewsDetails={viewsDetails!}
                            isOpen={viewsModalOpen}
                            onModalClose={handleViewsModalClose}
                          />
                        )}
                      </>
                    ) : null}

                    {typeof post.nbComments === "number" && (
                      <div className="text-gray-700 d-flex align-items-center gap-8 p-8 post-preview-comment-icon">
                        <span>{post.nbComments}</span>
                        <MessageInfo />
                      </div>
                    )}
                  </div>
                  {showReactions && typeof reactions?.summary === "object" ? (
                    <ReactionChoice
                      availableReactions={reactions.available}
                      summary={reactions.summary}
                      onChange={handleReactionOnChange}
                    />
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  rightIcon={<ArrowRight />}
                  color="secondary"
                  className="align-self-end"
                >
                  {t("blog.post.preview.readMore")}
                </Button>
              </div>
            </div>
          </Card.Body>
        </div>
      </Card>
      {blog && post && (
        <PostPreviewActionBar
          post={post}
          blog={blog}
          index={index}
          publicView={publicView}
        ></PostPreviewActionBar>
      )}
    </>
  );
};
