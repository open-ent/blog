import { useRef } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { Save, Send } from "@edifice-ui/icons";
import { Button, FormControl, Input, Label } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useActionDefinitions } from "../ActionBar/useActionDefinitions";
import { createPost, publishPost } from "~/services/api";

export interface CreatePostProps {
  blogId: string;
}

export const CreatePost = ({ blogId }: CreatePostProps) => {
  const editorRef = useRef<EditorRef>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("blog");

  const navigate = useNavigate();

  const { mustSubmit } = useActionDefinitions([]);

  const create = async () => {
    const contentHtml = editorRef.current?.getContent("html") as string;
    const title = titleRef.current?.value;
    if (!blogId || !title || title.trim().length == 0 || !contentHtml) return;
    return await createPost(blogId, title, contentHtml);
  };

  const handleCancelClick = () => {
    navigate(-1);
  };

  const handleSaveClick = async () => {
    const post = await create();
    if (post) navigate(`../${post?._id}`);
  };

  const handlePublishClick = async () => {
    const post = await create();
    if (post) {
      await publishPost(blogId, post, mustSubmit);
      navigate(`../..`);
    }
  };

  return (
    <div className="mt-32">
      <FormControl id="postTitle" isRequired className="mx-md-16">
        <Label>{t("blog.post.title-helper")}</Label>
        <Input
          ref={titleRef}
          type="text"
          size="md"
          placeholder={t("post.title.placeholder")}
        ></Input>
      </FormControl>
      <FormControl id="postContent" className="mt-16 mx-md-16">
        <Label>{t("blog.post.content-helper")}</Label>
      </FormControl>
      <div className="mx-md-16">
        <Editor ref={editorRef} content="" mode="edit"></Editor>
      </div>
      <div className="d-flex gap-8 justify-content-end mt-16 mx-md-16">
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
        <Button type="button" leftIcon={<Send />} onClick={handlePublishClick}>
          {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
        </Button>
      </div>
    </div>
  );
};
