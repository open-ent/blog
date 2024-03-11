import { useEffect, useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { Save, Send } from "@edifice-ui/icons";
import { Button, FormControl, Input, Label } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PostTitle } from "./PostTitle";
import { usePostActions } from "../ActionBar/usePostActions";
import { postContentActions } from "~/config/postContentActions";
import { Post } from "~/models/post";
import { baseUrl } from "~/routes";

export interface PostContentProps {
  post: Post;
  blogId: string;
}

export const PostContent = ({ blogId, post }: PostContentProps) => {
  // Get available actions and requirements for the post.
  const postActions = usePostActions(postContentActions, blogId, post);
  const { mustSubmit, save, trash, publish, readOnly } = postActions;

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
      navigate(-1);
    },
    onDelete: () => {
      trash();
      navigate(`/id/${blogId}`);
    },
    onEdit: () => {
      setMode("edit");
    },
    onPrint: () =>
      window.open(`${baseUrl}/print/${blogId}/post/${post._id}`, "_blank"),
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
    if (!post || !title || title.trim().length == 0 || !contentHtml) return;
    post.title = title;
    post.content = contentHtml;
    save();
    setMode("read");
  };

  // Publish or submit modifications
  const handlePublishClick = async () => {
    const contentHtml = editorRef.current?.getContent("html") as string;
    if (!post || !title || title.trim().length == 0 || !contentHtml) return;
    post.title = title;
    post.content = contentHtml;
    await save();
    await publish();
    setMode("read");
  };

  return (
    <>
      <PostTitle
        post={post}
        postActions={postActions}
        isSpeeching={editorRef.current?.isSpeeching()}
        mode={mode}
        blogId={blogId}
        {...postActionsHandlers}
      />
      <div className="mx-md-8">
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
              ></Input>
            </FormControl>
            <FormControl id="postContent" className="mt-16">
              <Label>{t("blog.post.content-helper")}</Label>
            </FormControl>
          </div>
        )}
        <Editor
          ref={editorRef}
          content={content}
          mode={mode}
          variant={variant}
        ></Editor>
        {mode === "edit" && (
          <div className="d-flex gap-8 justify-content-end my-8 sticky-bottom py-8 bg-white">
            <Button type="button" variant="ghost" onClick={handleCancelClick}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              leftIcon={<Save />}
              onClick={handleSaveClick}
            >
              {t("blog.save")}
            </Button>
            <Button
              type="button"
              leftIcon={<Send />}
              onClick={handlePublishClick}
            >
              {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
