import { ID, odeServices } from '@edifice.io/client';
import { getThumbnail } from '@edifice.io/utilities';

import { Post } from '~/models/post';

export function getAvatarURL(userId: ID): string {
  return odeServices.directory().getAvatarUrl(userId, 'user');
}

export function getUserbookURL(userId: ID): string {
  return odeServices.directory().getDirectoryUrl(userId, 'user');
}

export function extractMediaFromHTMLContent(contentHTML: string): {
  thumbnailURLs: string[];
  cleanedContent: string;
} {
  const getMediaTags = /<(img|video|iframe|audio|embed)[^>]*>(<\/\1>)?/gim;
  const getSrc = /src=(?:"|')([^"|']*)(?:"|')/;
  const mediaTags = contentHTML.match(getMediaTags);

  const thumbnailURLs: string[] = [];
  if (mediaTags?.length) {
    const imgTags = mediaTags.filter((tag) => tag.includes('img'));
    for (const tag of imgTags) {
      const srcMatch = getSrc.exec(tag);
      if (srcMatch?.length) {
        thumbnailURLs.push(getThumbnail(srcMatch[1], 0, 300));
      }
    }
  }

  const cleanedContent = contentHTML.replace(getMediaTags, '');

  return { thumbnailURLs, cleanedContent };
}

function extractMediaFromJSONNode(node: JSONContent): {
  thumbnailURLs: string[];
  cleanedNode: JSONContent | null;
} {
  const thumbnailURLs: string[] = [];
  const mediaTypes = ['image', 'video', 'iframe', 'audio', 'embed'];

  if (node && typeof node === 'object') {
    if (mediaTypes.includes(node.type!) && node.attrs?.src) {
      if (node.type === 'image') {
        thumbnailURLs.push(getThumbnail(node.attrs.src, 0, 300));
      }
      return { thumbnailURLs, cleanedNode: null };
    }

    if (node.content) {
      const cleanedContent: JSONContent[] = [];
      for (const child of node.content) {
        const result = extractMediaFromJSONNode(child);
        thumbnailURLs.push(...result.thumbnailURLs);
        if (result.cleanedNode !== null) {
          cleanedContent.push(result.cleanedNode);
        }
      }
      node.content = cleanedContent;
    }
  }

  return { thumbnailURLs, cleanedNode: node };
}

export function extractMediaFromTiptapJson(jsonContent: JSONContent): {
  thumbnailURLs: string[];
  cleanedContent: JSONContent;
} {
  const jsonObj = jsonContent;
  const { thumbnailURLs, cleanedNode } = extractMediaFromJSONNode(jsonObj);
  return { thumbnailURLs, cleanedContent: cleanedNode as JSONContent };
}

export function extractMediaFromPost(post: Post): {
  thumbnailURLs: string[];
  cleanedContent: string | JSONContent;
} {
  if (post.jsonContent) {
    return extractMediaFromTiptapJson(post.jsonContent);
  }
  return extractMediaFromHTMLContent(post.content);
}
export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};
