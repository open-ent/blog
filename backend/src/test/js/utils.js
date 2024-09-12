import http from 'k6/http';
import {sleep} from 'k6';

import {
    getHeaders,
    assertOk
  } from "https://raw.githubusercontent.com/juniorode/edifice-k6-commons/develop/dist/index.js";
  
const rootUrl = __ENV.ROOT_URL;

export function createBlog(blogName, session, commentType='NONE', publishType='RESTRAINT') {
    const headers = getHeaders(session);
    headers['content-type'] = 'application/json'
    const payload = JSON.stringify({
    title: blogName,
    description: `Description de ${blogName}`,
    thumbnail: '/blog/public/img/blog.png',
    'comment-type': commentType,
    'publish-type': publishType
    });
    let res = http.post(`${rootUrl}/blog`, payload, {headers})
    assertOk(res, 'create blog')
    const blogId = JSON.parse(res.body)['_id']
    return getBlog(blogId, session)
}

export function getBlog(blogId, session) {
    const res = http.get(`${rootUrl}/blog/${blogId}`, {headers: getHeaders(session)})
    const blog = JSON.parse(res.body)
    blog.id = blog._id;
    return blog;
}

export function addShareToUser(blog, user, shareType, session) {
    const headers = getHeaders(session)
    const res = http.get(`${rootUrl}/blog/share/json/${blog.id}`, {headers})
    assertOk(res);
    const existingShares = JSON.parse(res.body);
    const groups = existingShares.groups.checked;
    const users = existingShares.users.checked || {};
    const shareTypes = typeof shareType==="string" ? [`blog.${shareType}`] : shareType.map(t=>`blog.${t}`);
    const sharesToAdd = existingShares.actions.filter(
        action => shareTypes.findIndex(t=>t===action.displayName) >= 0
    ).flatMap(t => t.name ?? []);
    users[user.id] = sharesToAdd;
    const newShares = {
        bookmarks: {},
        groups,
        users
    }
    return shareBlog(blog, newShares, session);
}

export function shareBlog(blog, shares, session) {
    const res = http.put(
        `${rootUrl}/blog/share/resource/${blog.id}`,
        JSON.stringify(shares),
        {headers: getHeaders(session)});
    sleep(1); // Let the backend digests the new shares.
    return res;
}

export function createPost(title, content, blog, session) {
    const headers = getHeaders(session)
    headers['content-type'] = 'application/json'
    const postPayload = JSON.stringify({
        title,
        content,
    })
    const res = http.post(`${rootUrl}/blog/post/${blog.id}`, postPayload, {headers})
    if(res.status === 200) {
        const postId = JSON.parse(res.body)['_id']
        return getPost(blog.id, postId, 'DRAFT', session);
    } else {
        console.warn('Could not create post')
    }
    return null;
}

export function submitPost(blog, post, session) {
    const headers = getHeaders(session)
    headers['content-type'] = 'application/json'
    return http.put(`${rootUrl}/blog/post/submit/${blog.id}/${post.id}`, {}, {headers});
}

export function publishPost(blog, post, session) {
    const headers = getHeaders(session)
    headers['content-type'] = 'application/json'
    return http.put(`${rootUrl}/blog/post/publish/${blog.id}/${post.id}`, {}, {headers});
}

export function getPost(blogId, postId, state, session) {
    const res = http.get(`${rootUrl}/blog/post/${blogId}/${postId}?state=${state}`, {headers: getHeaders(session)})
    if(res.status === 200) {
        const post = JSON.parse(res.body);
        post.id = post._id;
        return post;
    }
    console.warn(`Could not fetch post ${postId}`)
    return null;
}

export function deletePost(blog, post, session) {
    console.log("Deleting post.....")
    return http.del(`${rootUrl}/blog/post/${blog.id}/${post.id}`, {headers: getHeaders(session)})
}

export function getComments(blog, post, session) {
    const res = http.get(`${rootUrl}/blog/comments/${blog.id}/${post.id}`, {headers: getHeaders(session)});
    assertOk(res, 'get comments');
    const comments = JSON.parse(res.body);
    return comments;
}

export function createComment(blog, post, text, session) {
    const headers = getHeaders(session);
    headers['content-type'] = 'application/json';
    const payload = JSON.stringify({
        comment: text,
    });
    const res = http.post(`${rootUrl}/blog/comment/${blog.id}/${post.id}`, payload, {headers});
    assertOk(res, 'create comment');
    const comments = getComments(blog, post, session);
    if(comments && comments.length > 0) {
        return comments[comments.length-1];
    } else {
        console.warn('New comment unavailable.');
    }
    return null;
}

export function updateComment(blog, post, comment, text, session) {
    const headers = getHeaders(session);
    headers['content-type'] = 'application/json';
    const payload = JSON.stringify({
        comment: text,
    });
    return http.put(`${rootUrl}/blog/comment/${blog.id}/${post.id}/${comment.id}`, payload, {headers});
}

export function deleteComment(blog, post, comment, session) {
    console.log("Deleting comment.....")
    const res = http.del(`${rootUrl}/blog/comment/${blog.id}/${post.id}/${comment.id}`, {headers: getHeaders(session)});
    assertOk(res, 'delete comment');
    return res;
}
