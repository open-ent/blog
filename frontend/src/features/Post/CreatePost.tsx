import { useRef } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { Save, Send } from "@edifice-ui/icons";
import { Button, FormControl, Input, Label } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useActionDefinitions } from "../ActionBar/useActionDefinitions";
import { ButtonGroup } from "~/components/ButtonGroup/ButtonGroup";
import { TTITLE_LENGTH_MAX } from "~/config/init-config";
import { useBlog, useCreatePost, usePublishPost } from "~/services/queries";

export interface CreatePostProps {
  blogId: string;
}

export const CreatePost = ({ blogId }: CreatePostProps) => {
  const { blog } = useBlog(blogId);
  const editorRef = useRef<EditorRef>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("blog");

  const navigate = useNavigate();

  const { mustSubmit, getDefaultPublishKeyword } = useActionDefinitions([]);
  const createMutation = useCreatePost(blogId);
  const publishMutation = usePublishPost(blogId);

  if (!blog) return <></>;

  const disableButtons = createMutation.isPending || publishMutation.isPending;

  const create = async () => {
    const content = editorRef.current?.getContent("html") as string;
    const title = titleRef.current?.value;
    if (!blogId || !title || title.trim().length == 0 || !content) return;
    return await createMutation.mutateAsync({ title, content });
  };

  const handleCancelClick = () => {
    navigate(-1);
  };

  const handleSaveClick = async () => {
    const post = await create();
    if (post) navigate(`/id/${blog?._id}/post/${post?._id}`);
  };

  const handlePublishClick = async () => {
    const post = await create();
    if (post) {
      await publishMutation.mutate({
        post,
        publishWith: getDefaultPublishKeyword(post.author.userId),
      });
      navigate(`/id/${blog?._id}/post/${post?._id}`);
    }
  };

  return (
    <div className="post-container mt-32">
      <FormControl id="postTitle" isRequired className="mx-md-16">
        <Label>{t("blog.post.title-helper")}</Label>
        <Input
          ref={titleRef}
          type="text"
          size="md"
          placeholder={t("post.title.placeholder")}
          maxLength={TTITLE_LENGTH_MAX}
        ></Input>
      </FormControl>
      <FormControl id="postContent" className="mt-16 mx-md-16">
        <Label>{t("blog.post.content-helper")}</Label>
      </FormControl>
      <div className="mx-md-16">
        <Editor
          ref={editorRef}
          content=""
          mode="edit"
          visibility={blog?.visibility === "PUBLIC" ? "public" : "protected"}
        ></Editor>
      </div>
      <ButtonGroup className="gap-8 mt-16 mx-md-16" variant="reverse">
        <Button type="button" variant="ghost" onClick={handleCancelClick}>
          {t("cancel")}
        </Button>
        <Button
          type="button"
          variant="outline"
          leftIcon={<Save />}
          disabled={disableButtons}
          onClick={handleSaveClick}
        >
          {t("blog.save")}
        </Button>
        <Button
          type="button"
          leftIcon={<Send />}
          disabled={disableButtons}
          onClick={handlePublishClick}
        >
          {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
        </Button>
      </ButtonGroup>
    </div>
  );
};
