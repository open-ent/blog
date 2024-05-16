import http from 'k6/http';

import {
    getHeaders,
    assertOk
  } from "https://raw.githubusercontent.com/juniorode/edifice-k6-commons/develop/dist/index.js";
  
const rootUrl = __ENV.ROOT_URL;

export function createBlog(blogName, session) {
    const headers = getHeaders(session);
    headers['content-type'] = 'application/json'
    const payload = JSON.stringify({
    title: blogName,
    description: `Description de ${blogName}`,
    thumbnail: '/blog/public/img/blog.png',
    'comment-type': 'NONE',
    'publish-type': 'RESTRAINT'
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
    const sharesToAdd = existingShares.actions.filter(action => action.displayName === `blog.${shareType}`)[0]
    users[user.id] = sharesToAdd;
    const newShares = {
        bookmarks: {},
        groups,
        users
    }
    return shareBlog(blog, newShares, session)
}

export function shareBlog(blog, shares, session) {
    return http.put(
        `${rootUrl}/blog/share/resource/${blog.id}`,
        JSON.stringify(shares),
        {headers: getHeaders(session)})
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

export function getPost(blogId, postId, state, session) {
    console.log(`${rootUrl}/blog/post/${blogId}/${postId}?state=${state}`)
    const res = http.get(`${rootUrl}/blog/post/${blogId}/${postId}?state=${state}`, {headers: getHeaders(session)})
    if(res.status === 200) {
        const post = JSON.parse(res.body);
        post.id = post._id;
        return post;
    }
    console.warn('Could not fetch post')
    return null;
}



export function deletePost(blog, post, session) {
    console.log("Deleting post.....")
    return http.del(`${rootUrl}/blog/post/${blog.id}/${post.id}`, {headers: getHeaders(session)})
}