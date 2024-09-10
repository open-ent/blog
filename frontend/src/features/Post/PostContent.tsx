import { Suspense, useEffect, useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { Save, Send } from "@edifice-ui/icons";
import {
  Alert,
  Button,
  FormControl,
  Input,
  Label,
  Loading,
} from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PostAudience } from "./PostAudience";
import { PostTitle } from "./PostTitle";
import { usePostActions } from "../ActionBar/usePostActions";
import { CommentsCreate } from "../Comments/CommentsCreate";
import { CommentsHeader } from "../Comments/CommentsHeader";
import { CommentsList } from "../Comments/CommentsList";
import { ButtonGroup } from "~/components/ButtonGroup/ButtonGroup";
import OldFormatModal from "~/components/OldFormatModal/OldFormatModal";
import { TTITLE_LENGTH_MAX } from "~/config/init-config";
import { postContentActions } from "~/config/postContentActions";
import { Comment } from "~/models/comment";
import { Post } from "~/models/post";
import { baseUrl } from "~/routes";
import { useBlog } from "~/services/queries";
import { isEmptyEditorContent } from "~/utils/EditorHasContent";

export interface PostContentProps {
  post: Post;
  blogId: string;
  comments?: Comment[];
}

export const PostContent = ({ blogId, post, comments }: PostContentProps) => {
  const { blog, publicView, isPublicBlog } = useBlog();
  // Get available actions and requirements for the post.
  const postActions = usePostActions(postContentActions, blogId, post);
  const {
    mustSubmit,
    save,
    trash,
    publish,
    readOnly,
    isMutating,
    saveButtonI18nKey,
    hideSaveButton,
    showViews,
  } = postActions;

  // Get the query parameters in URL to know if the post is in edit mode.
  const [searchParams, setSearchParams] = useSearchParams();

  const editorRef = useRef<EditorRef>(null);
  const titleRef = useRef(null);

  // Variables for edit mode
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [mode, setMode] = useState<"read" | "edit">(
    searchParams.get("edit") && !readOnly ? "edit" : "read",
  );
  const [variant, setVariant] = useState<"ghost" | "outline">("ghost");
  const [isOldFormatOpen, setIsOldFormat] = useState(false);
  const [isEmptyContent, setIsEmptyContent] = useState<boolean>(false);

  const { t } = useTranslation("blog");

  const navigate = useNavigate();

  // Changing mode displays another variant of the editor.
  useEffect(() => {
    if (searchParams.get("edit") && mode !== "edit") {
      setSearchParams({}, { replace: true });
    }
    setVariant(mode === "read" ? "ghost" : "outline");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Handlers for actions triggered from the post title component.
  const postActionsHandlers = {
    onBackward: () => {
      navigate(`../..`, {
        relative: "path",
        state: { defaultFilter: post.state },
      });
    },
    onDelete: () => {
      trash();
      navigate(`/id/${blogId}`);
    },
    onEdit: () => {
      setMode("edit");
    },
    onPrint: () => {
      if (publicView) {
        window.open(
          `${baseUrl}/pub/${blog?.slug}/print/post/${post._id}`,
          "_blank",
        );
      } else {
        window.open(`${baseUrl}/print/${blogId}/post/${post._id}`, "_blank");
      }
    },
    onPublish: () => {
      publish();
    },
    onTts: () => editorRef.current?.toogleSpeechSynthetisis(),
  };

  // Cancel modifications
  const handleCancelClick = () => {
    setMode("read");
    // Restore previous content
    setContent(post?.content ?? "");
  };

  // Save modifications
  const handleSaveClick = () => {
    const contentHtml = editorRef.current?.getContent("html") as string;
    const contentJson = editorRef.current?.getContent("json") as JSON;
    if (post && (!isEmptyContent || title.length !== 0)) {
      post.title = title;
      post.content = contentHtml;
      post.jsonContent = contentJson;
      save();
      setMode("read");
    }
  };

  // Publish or submit modifications
  const handlePublishClick = async () => {
    const contentHtml = editorRef.current?.getContent("html") as string;
    if (!post || !title || title.trim().length == 0 || isEmptyContent) return;
    post.title = title;
    post.content = contentHtml;
    await save(true);
    await publish(true);
    setMode("read");
  };

  const handleContentChange = ({ editor }: { editor: any }) => {
    const content = editor?.getJSON();
    const emptyContent = isEmptyEditorContent(content);
    setIsEmptyContent(emptyContent);
  };

  const withAudience = !isPublicBlog && mode === "read";

  return (
    <div className="post-container mb-48">
      <PostTitle
        post={post}
        postActions={postActions}
        isSpeeching={editorRef.current?.isSpeeching()}
        mode={mode}
        {...postActionsHandlers}
      />
      {post.contentVersion === 0 && mode === "read" ? (
        <Alert
          type="warning"
          className="my-24"
          button={
            <Button
              color="tertiary"
              type="button"
              variant="ghost"
              className="text-gray-700"
              onClick={() => setIsOldFormat(true)}
            >
              {t("post.oldFormat.open")}
            </Button>
          }
        >
          {t("post.oldFormat.text")}
        </Alert>
      ) : (
        <></>
      )}
      <div className="mx-md-8 post-content-editor">
        {mode === "edit" && (
          <div className="mt-24">
            <FormControl id="postTitle" isRequired>
              <Label>{t("blog.post.title-helper")}</Label>
              <Input
                ref={titleRef}
                type="text"
                size="md"
                placeholder={t("post.title.placeholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TTITLE_LENGTH_MAX}
              ></Input>
            </FormControl>
            <FormControl id="postContent" className="mt-16">
              <Label>{t("blog.post.content-helper")}</Label>
            </FormControl>
          </div>
        )}
        <Editor
          id="postContent"
          ref={editorRef}
          content={content}
          mode={mode}
          variant={variant}
          visibility={blog?.visibility === "PUBLIC" ? "public" : "protected"}
          onContentChange={handleContentChange}
        ></Editor>
        {mode === "edit" && (
          <ButtonGroup
            className="gap-8 my-8 sticky-bottom py-8 bg-white z-0"
            variant="reverse"
          >
            <Button
              type="button"
              variant={hideSaveButton ? "outline" : "ghost"}
              onClick={handleCancelClick}
            >
              {t("cancel")}
            </Button>
            {!hideSaveButton && (
              <Button
                type="button"
                variant="outline"
                leftIcon={isMutating ? <Loading isLoading={true} /> : <Save />}
                disabled={isMutating || (isEmptyContent && title.length == 0)}
                onClick={handleSaveClick}
              >
                {t(saveButtonI18nKey)}
              </Button>
            )}
            <Button
              type="button"
              leftIcon={isMutating ? <Loading isLoading={true} /> : <Send />}
              disabled={isMutating || title.length == 0 || isEmptyContent}
              onClick={handlePublishClick}
            >
              {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
            </Button>
          </ButtonGroup>
        )}
      </div>

      <div className="d-flex flex-column-reverse flex-md-row justify-content-between align-items-start align-items-md-center mt-32 pt-24 pb-8 gap-16">
        {mode === "read" && !!comments && (
          <div className="mx-md-8">
            <CommentsHeader comments={comments} />
          </div>
        )}
        {withAudience && <PostAudience post={post} withViews={showViews} />}
      </div>

      {mode === "read" && !!comments && (
        <div className="mx-md-8">
          <CommentsCreate />
          <CommentsList comments={comments} />
        </div>
      )}
      <Suspense>
        {isOldFormatOpen && mode === "read" && (
          <OldFormatModal
            blogId={blogId}
            postId={post._id}
            isOpen={isOldFormatOpen}
            onCancel={() => setIsOldFormat(false)}
          ></OldFormatModal>
        )}
      </Suspense>
    </div>
  );
};
