export const isEmptyEditorContent = (content: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  const containsMedia = doc.querySelector("img, video, audio, iframe") !== null;

  const hasTextContent = doc?.body?.textContent?.trim() !== "";

  return !hasTextContent && !containsMedia;
};
