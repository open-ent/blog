import { useRef, useState } from "react";

import { Editor, EditorRef } from "@edifice-ui/editor";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

import { Post } from "~/models/post";
import { postQuery } from "~/services/queries";


/** Load a blog post content */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    if (blogId && postId) {
      const query = postQuery(blogId, postId);
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    }
    return Promise.resolve(null);
  };

export function Component() {
  const post = useLoaderData() as Post | null;
  const editorRef = useRef<EditorRef>(null);
  const [content /*, setContent*/] = useState(post?.content ?? "");
  const [mode /*, setMode*/] = useState<"read" | "edit">("read");

  return <Editor ref={editorRef} content={content} mode={mode}></Editor>;
}
