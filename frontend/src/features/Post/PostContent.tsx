import { useEffect, useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { Save, Send } from "@edifice-ui/icons";
import { Button, FormControl, Input, Label } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { usePostContext } from "./PostProvider";
import { PostTitle } from "./PostTitle";
import { publishPost } from "~/services/api";

export const PostContent = () => {
  const { blogId, post, mustSubmit, save, trash } = usePostContext();

  const editorRef = useRef<EditorRef>(null);
  const titleRef = useRef(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [variant, setVariant] = useState<"ghost" | "outline">("ghost");

  const { t } = useTranslation("blog");

  const navigate = useNavigate();

  useEffect(() => {
    setVariant(mode === "read" ? "ghost" : "outline");
  }, [mode]);

  const postHeaderEventsHandler = {
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
    onPrint: () => alert("print !"), // TODO
    onPublish: () => (mustSubmit ? alert("submit") : alert("publish")), // TODO
    onTts: () => editorRef.current?.toogleSpeechSynthetisis(),
  };

  const handleCancelClick = () => {
    setMode("read");
    // Restore previous content
    setContent(post?.content ?? "");
  };

  const handleSaveClick = () => {
    const contentHtml = editorRef.current?.getContent("html") as string;
    if (!post || !title || title.trim().length == 0 || !contentHtml) return;
    post.title = title;
    post.content = contentHtml;
    save();
    setMode("read");
  };

  const handlePublishClick = async () => {
    if (!blogId || !post) return;
    //TODO mustSubmit ? alert("submit") : alert("publish");
    try {
      handleSaveClick();
      await publishPost(blogId, post, mustSubmit);
      // TODO update state
    } catch (e) {
      // HTTP failure has already been notified to the user.
    }
  };

  return (
    <>
      <PostTitle
        isSpeeching={editorRef.current?.isSpeeching()}
        mode={mode}
        {...postHeaderEventsHandler}
      />
      {mode === "edit" && (
        <div className="mt-24 mx-md-16 mx-lg-64">
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
      <div className="mx-md-16 mx-lg-64">
        <Editor
          ref={editorRef}
          content={content}
          mode={mode}
          variant={variant}
        ></Editor>
      </div>
      {mode === "edit" && (
        <div className="d-flex gap-8 justify-content-end my-16 mx-md-16 mx-lg-64">
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
    </>
  );
};
