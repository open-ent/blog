import { useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import {
  ArrowLeft,
  ArrowUp,
  Delete,
  Edit,
  Options,
  Print,
  TextToSpeech,
} from "@edifice-ui/icons";
import { Button, Dropdown, IconButton } from "@edifice-ui/react";
import { ACTION } from "edifice-ts-client";
import { useTranslation } from "react-i18next";

import { usePostActions } from "../ActionBar/usePostActions";
import { postContentActions } from "~/config/postContentActions";
import { Post } from "~/models/post";

type PostContentProps = { post: Post };

export const PostContent = ({ post }: PostContentProps) => {
  const editorRef = useRef<EditorRef>(null);
  const [content /*, setContent*/] = useState(post?.content ?? "");
  const [mode /*, setMode*/] = useState<"read" | "edit">("read");
  const { t } = useTranslation();

  // -- Get all rights the current user has on the post, without constraints on its status.
  const { actions, mustSubmit } = usePostActions(postContentActions, post);

  // UI may focus on readOnly(=true) mode, or on read / edit mode (=false)
  const readOnly =
    !!actions && actions.findIndex((action) => action.id === ACTION.OPEN) < 0;
  const canPublish =
    !!actions &&
    actions.findIndex((action) => action.id === ACTION.PUBLISH) >= 0;

  const handlePrintClick = () => alert("print !"); // TODO
  const handleTtsClick = () => editorRef.current?.toogleSpeechSynthetisis();
  const handleEditClick = () => alert("edit !"); // TODO
  const handleDeleteClick = () => alert("delete"); // TODO
  const handlePublishOrSubmitClick = () =>
    mustSubmit ? alert("submit") : alert("publish"); // TODO
  const handleMoveupClick = () => alert("republish"); // TODO

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <Button
          type="button"
          color="tertiary"
          variant="ghost"
          leftIcon={<ArrowLeft />}
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
      <div className="mx-md-16">
        <Editor ref={editorRef} content={content} mode={mode}></Editor>
      </div>
    </>
  );
};
