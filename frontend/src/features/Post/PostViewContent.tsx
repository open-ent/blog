import { useEffect, useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import {
  ArrowLeft,
  ArrowUp,
  Delete,
  Edit,
  Options,
  Print,
  Save,
  Send,
  TextToSpeech,
} from "@edifice-ui/icons";
import {
  Button,
  Dropdown,
  FormControl,
  IconButton,
  Input,
  Label,
} from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { usePostContext } from "./PostProvider";
import { publishPost, savePost } from "~/services/api";

export const PostViewContent = () => {
  const { blogId, post, mustSubmit, readOnly, canPublish } = usePostContext();

  const editorRef = useRef<EditorRef>(null);
  const titleRef = useRef(null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [variant, setVariant] = useState<"ghost" | "outline">("ghost");
  const { t } = useTranslation();

  const navigate = useNavigate();

  useEffect(() => {
    setVariant(mode === "read" ? "ghost" : "outline");
  }, [mode]);

  const handleBackwardClick = () => navigate(-1); // TODO
  const handlePrintClick = () => alert("print !"); // TODO
  const handleTtsClick = () => editorRef.current?.toogleSpeechSynthetisis();

  const handleEditClick = () => {
    setMode("edit");
  };

  const handleDeleteClick = () => alert("delete"); // TODO
  const handlePublishOrSubmitClick = () =>
    mustSubmit ? alert("submit") : alert("publish"); // TODO
  const handleMoveupClick = () => alert("republish"); // TODO

  const handleCancelClick = () => {
    setMode("read");
    // Restore previous content
    setContent(post.content);
  };

  const handleSaveClick = async () => {
    const contentHtml = editorRef.current?.getContent("html") as string;
    if (!title || title.trim().length == 0 || !contentHtml) return;
    // TODO set title+content in store
    post.title = title;
    post.content = contentHtml;
    const { state } = await savePost(blogId, post);
    if (state) post.state = state;
    // TODO set state in store
  };

  const handleSaveThenPublishOrSubmitClick = async () => {
    //TODO mustSubmit ? alert("submit") : alert("publish");
    try {
      await handleSaveClick();
      await publishPost(blogId, post);
      // TODO update state
    } catch (e) {
      // HTTP failure has already been notified to the user.
    }
  };

  return (
    <>
      {mode === "read" ? (
        <div className="d-flex justify-content-between align-items-center">
          <Button
            type="button"
            color="tertiary"
            variant="ghost"
            leftIcon={<ArrowLeft />}
            onClick={handleBackwardClick}
          >
            {t("back")}
          </Button>
          <div className="d-flex m-16 gap-12">
            {readOnly ? (
              <>
                <IconButton
                  icon={<Print />}
                  color="primary"
                  variant="outline"
                  aria-label={t("print")}
                  onClick={handlePrintClick}
                />
                <IconButton
                  icon={<TextToSpeech />}
                  color="primary"
                  variant="outline"
                  className={
                    editorRef.current?.isSpeeching() ? "bg-secondary" : ""
                  }
                  aria-label={t("tiptap.toolbar.tts")}
                  onClick={handleTtsClick}
                />
              </>
            ) : (
              <>
                <Button leftIcon={<Edit />} onClick={handleEditClick}>
                  {t("edit")}
                </Button>
                <Dropdown>
                  <Dropdown.Trigger icon={<Options />}></Dropdown.Trigger>
                  <Dropdown.Menu>
                    {canPublish && (
                      <Dropdown.Item
                        type="action"
                        onClick={handlePublishOrSubmitClick}
                      >
                        {mustSubmit ? t("blog.submitPost") : t("blog.publish")}
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item
                      type="action"
                      icon={<ArrowUp />}
                      onClick={handleMoveupClick}
                    >
                      {t("goUp")}
                    </Dropdown.Item>
                    <Dropdown.Item
                      type="action"
                      icon={<Print />}
                      onClick={handlePrintClick}
                    >
                      {t("blog.print")}
                    </Dropdown.Item>

                    <Dropdown.Item
                      type="action"
                      icon={<Delete />}
                      onClick={handleDeleteClick}
                    >
                      {t("blog.delete.post")}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <FormControl id="postTitle" isRequired className="mx-md-16">
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
          <FormControl id="postContent" className="mt-16 mx-md-16">
            <Label>{t("blog.post.content-helper")}</Label>
          </FormControl>
        </>
      )}
      <div className="mx-md-16">
        <Editor
          ref={editorRef}
          content={content}
          mode={mode}
          variant={variant}
        ></Editor>
      </div>
      {mode === "edit" && (
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
          <Button
            type="button"
            leftIcon={<Send />}
            onClick={handleSaveThenPublishOrSubmitClick}
          >
            {t("blog.publish")}
          </Button>
        </div>
      )}
    </>
  );
};
