import { ViewsDetails, odeServices } from '@edifice.io/client';

import { Post, PostMetadata } from '~/models/post';
import { checkHttpError } from '~/utils/BlogEvent';

/** Use to get a the state of a post without the content */
export async function loadPostMetadata(blogId: string, postId: string) {
  const results = await checkHttpError(
    odeServices
      .http()
      .get<PostMetadata[]>(`/blog/post/list/all/${blogId}?postId=${postId}`),
  );
  return results[0];
}

/**
 * Load a post with its content /!\ You need to have the right state to call this function otherwise you will get an error
 * @param blogId
 * @param post
 * @returns
 */
export async function loadPost(blogId: string, post: PostMetadata) {
  const { _id: postId, state } = post;
  return checkHttpError(
    odeServices
      .http()
      .get<Post>(`/blog/post/${blogId}/${postId}?state=${state}`),
  );
}

export function loadOriginalPost(blogId: string, post: PostMetadata) {
  const { _id: postId, state } = post;
  return checkHttpError(
    odeServices
      .http()
      .get<Post>(
        `/blog/post/${blogId}/${postId}?state=${state}&originalFormat=true`,
      ),
  );
}

export async function loadPublicPost(blogId: string, postId: string) {
  const results = await checkHttpError(
    odeServices
      .http()
      .get<Post[]>(`/blog/pub/posts/${blogId}?postId=${postId}`),
  );
  return results[0];
}

export function deletePost(blogId: string, postId: string) {
  return checkHttpError(
    odeServices.http().delete<void>(`/blog/post/${blogId}/${postId}`),
  );
}

export function savePost(blogId: string, post: Post) {
  const { _id: postId, title, content } = post;
  return checkHttpError(
    odeServices.http().putJson<PostMetadata>(
      `/blog/post/${blogId}/${postId}`,
      {
        title,
        content,
      },
      // Do not emit any notification that is catched+shown by the MediaLibrary.
      // The Post component has its own notification channel instead.
      { disableNotifications: true },
    ),
  );
}

export function goUpPost(blogId: string, postId: string) {
  return checkHttpError(
    odeServices.http().putJson<PostMetadata>(`/blog/post/${blogId}/${postId}`, {
      sorted: true,
    }),
  );
}

export function publishPost(
  blogId: string,
  post: Post,
  publishWith: 'publish' | 'submit',
  fromEditor?: boolean,
) {
  const { _id: postId } = post;
  return checkHttpError(
    odeServices.http().putJson<Post>(
      `/blog/post/${publishWith}/${blogId}/${postId}`,
      {},
      // Do not emit any notification that is catched+shown by the MediaLibrary.
      // The Post component has its own notification channel instead.
      { disableNotifications: fromEditor },
    ),
  );
}

export function createPost(blogId: string, title: string, content: string) {
  return checkHttpError(
    odeServices.http().postJson<Post>(`/blog/post/${blogId}`, {
      title,
      content,
    }),
  );
}

export function loadPostViewsDetails(resourceId: string) {
  const viewService = odeServices.audience('blog', 'post').views;
  return checkHttpError<ViewsDetails | undefined>(
    viewService.getDetails(resourceId),
  );
}

export function triggerViewOnPost(resourceId: string) {
  const viewService = odeServices.audience('blog', 'post').views;
  return checkHttpError<void>(viewService.trigger(resourceId));
}
