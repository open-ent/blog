/*
 * Copyright © "Open Digital Education" (SAS “WebServices pour l’Education”), 2014
 *
 * This program is published by "Open Digital Education" (SAS “WebServices pour l’Education”).
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Open Digital Education" with a reference to the website: https: //opendigitaleducation.com/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package org.entcore.blog.security;

import com.mongodb.DBObject;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.Utils;
import fr.wseduc.webutils.http.Binding;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Promise;
import io.vertx.core.eventbus.Message;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.bson.conversions.Bson;
import org.entcore.blog.controllers.BlogController;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.services.PostService;
import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.user.UserInfos;
import org.entcore.common.utils.StringUtils;

import java.util.*;

import static com.mongodb.client.model.Filters.*;

public class BlogResourcesProvider implements ResourcesProvider {

	protected static final Logger log = LoggerFactory.getLogger(BlogResourcesProvider.class);

	private MongoDb mongo = MongoDb.getInstance();

	@Override
	public void authorize(HttpServerRequest request, Binding binding, UserInfos user, Handler<Boolean> handler) {
		final String serviceMethod = binding.getServiceMethod();
		if (serviceMethod != null && serviceMethod.startsWith(BlogController.class.getName())) {
			String method = serviceMethod.substring(BlogController.class.getName().length() + 1);
			switch (method) {
			case "update":
			case "delete":
			case "get":
			case "shareResource":
			case "publishToLibrary":
			case "shareJson":
			case "shareJsonSubmit":
			case "removeShare":
				authorizeBlog(request, user, binding.getServiceMethod(), handler);
				break;
			default:
				handler.handle(false);
			}
		} else if (serviceMethod != null && serviceMethod.startsWith(PostController.class.getName())) {
			String method = serviceMethod.substring(PostController.class.getName().length() + 1);
			switch (method) {
			case "get":
				authorizeGetPost(request, user, binding.getServiceMethod(), handler);
				break;
			case "list":
			case "create":
			case "submit":
			case "publish":
			case "comments":
			case "comment":
				authorizeBlog(request, user, binding.getServiceMethod(), handler);
				break;
			case "update":
			case "delete":
			case "unpublish":
				hasRightOnPost(request, user, handler, serviceMethod.replaceAll("\\.", "-"));
				break;
			default:
				handler.handle(false);
			}
		} else {
			handler.handle(false);
		}
	}

	private void authorizeBlog(HttpServerRequest request, UserInfos user, String serviceMethod,
			Handler<Boolean> handler) {
		String id = request.params().get("blogId");
		if (id != null && !id.trim().isEmpty()) {
			Bson query = getDefaultQueryBuilder(user, serviceMethod, id);
			executeCountQuery(request, "blogs", MongoQueryBuilder.build(query), 1, handler);
		} else {
			handler.handle(false);
		}
	}

	private Bson getDefaultQueryBuilder(UserInfos user, String serviceMethod, String id) {
		final List<Bson> groups = new ArrayList<>();
		groups.add(and(
			eq("userId", user.getUserId()),
			eq(serviceMethod.replaceAll("\\.", "-"), true)
		));
		groups.add(and(eq("userId", user.getUserId()), eq("manager", true)));
		for (String gpId : user.getGroupsIds()) {
			groups.add(and(eq("groupId", gpId), eq(serviceMethod.replaceAll("\\.", "-"), true)));
			groups.add(and(eq("groupId", gpId), eq("manager", true)));
		}
		return and(
			eq("_id", id),
			or(
				eq("author.userId", user.getUserId()),
				elemMatch("shared", or(groups))
			)
		);
	}

	private void authorizeGetPost(HttpServerRequest request, final UserInfos user, String serviceMethod,
			final Handler<Boolean> handler) {
		String blogId = request.params().get("blogId");
		String postId = request.params().get("postId");
		if (blogId != null && !blogId.trim().isEmpty() && postId != null && !postId.trim().isEmpty()) {
			PostService.StateType state = getStateType(request);
			if (PostService.StateType.PUBLISHED.equals(state)) {
				final Bson query = getDefaultQueryBuilder(user, serviceMethod, blogId);
				executeCountQuery(request, "blogs", MongoQueryBuilder.build(query), 1, handler);
			} else {
				//if not published, can i submit it?
				hasRightOnPost(request, user, handler, PostController.SUBMIT_ACTION);
			}
		} else {
			handler.handle(false);
		}
	}

	private void hasRightOnPost(final HttpServerRequest request, final UserInfos user, final Handler<Boolean> handler,
			String action) {
		String postId = request.params().get("postId");
		if (StringUtils.isEmpty(postId)) {
			handler.handle(false);
			return;
		}
		request.pause();
		hasRightsOnAllPosts(user.getUserId(), new HashSet<>(user.getGroupsIds()), Collections.singleton(postId), action)
		.onComplete(event -> {
			request.resume();
			final boolean succeeded = event.succeeded();
			if (!succeeded) {
				log.error("Error while checking access rights on posts.", event.cause());
			}
			handler.handle(succeeded && event.result());
		});
	}

	public Future<Boolean> hasRightsOnAllPosts(final String userId, final Set<String> userGroups, final Set<String> postIds, String action) {
		Promise<Boolean> promise = Promise.promise();
		final JsonArray resourceIdsArray = new JsonArray();
		postIds.forEach(resourceIdsArray::add);
		final JsonObject postKeys = new JsonObject()
				.put("author", 1)
				.put("blog", 1);
		final JsonObject blogKeys = new JsonObject()
				.put("author", 1)
				.put("shared", 1);
		final Bson postsQuery = in("_id", resourceIdsArray);
		// retrieve posts
		mongo.find("posts", MongoQueryBuilder.build(postsQuery), null, postKeys, postsQueryResponse -> {
			Either<String, JsonArray> postsQueryResult = Utils.validResults(postsQueryResponse);
			if (postsQueryResult.isRight()) {
				JsonArray posts = postsQueryResult.right().getValue();
				if (posts.size() != resourceIdsArray.size()) {
					promise.complete(false);
				} else {
					JsonArray blogIdsToBeChecked = getBlogIdsTobeChecked(posts, userId);
					if (blogIdsToBeChecked.isEmpty()) {
						// User is author of all posts and no posts needs to be checked on blog level
						promise.complete(true);
					} else {
						// Check rights on blog level
						final Bson blogQuery = in("_id", blogIdsToBeChecked);
						mongo.find("blogs", MongoQueryBuilder.build(blogQuery), null, blogKeys, blogQueryResponse -> {
							Either<String, JsonArray> blogQueryResult = Utils.validResults(blogQueryResponse);
							if (blogQueryResult.isRight()) {
								JsonArray blogs = blogQueryResult.right().getValue();
								if (blogs.isEmpty()) {
									promise.complete(false);
								} else {
									promise.complete(checkRightsOnAllBlogs(blogs, userGroups, userId, action));
								}
							} else {
								promise.fail(blogQueryResult.left().getValue());
							}
						});
					}
				}
			} else {
				promise.fail(postsQueryResult.left().getValue());
			}
		});
		return promise.future();
	}

	/**
	 * Checks if user is author of a list of posts.
	 * If not, returns the list of parent blog ids for which user is not author of post.
	 * @param posts list of posts to be checked
	 * @param userId id of user
	 * @return the list of blog ids whose posts are not authored by user
	 */
	private JsonArray getBlogIdsTobeChecked(JsonArray posts, String userId) {
		JsonArray blogIdsToBeChecked = new JsonArray();
		posts.stream()
				.filter(post -> !((JsonObject) post).getJsonObject("author").getString("userId").equals(userId))
				.map(post -> ((JsonObject) post).getJsonObject("blog").getString("$id"))
				.distinct()
				.forEach(blogIdsToBeChecked::add);
		return blogIdsToBeChecked;
	}

	/**
	 * <p>
	 * Checks if user has access rights on all blogs.
	 * </p>
	 * <p>
	 *   <b>NB :</b> Only <u>the author</u> of a post can <u>delete</u> it, even if they have shares rights.
	 * </p>
	 * @param blogs the blogs to be checked
	 * @param userGroups the groups of the user
	 * @param userId id of user
	 * @param action right on resource
	 * @return whether user has author or share rights on all blogs
	 */
	private boolean checkRightsOnAllBlogs(JsonArray blogs, Set<String> userGroups, String userId, String action) {
		return blogs.stream().allMatch(blog -> {
			JsonObject blogObject = (JsonObject) blog;
			final boolean isBlogAuthor = blogObject.getJsonObject("author").getString("userId").equals(userId);
			final boolean hasShareRights = blogObject.getJsonArray("shared").stream().anyMatch(rights -> {
				JsonObject jsonRights = (JsonObject) rights;
				return jsonRights.getBoolean(action, false) &&
						(userId.equals(jsonRights.getString("userId"))
								|| userGroups.contains(jsonRights.getString("groupId"))) &&
					(!action.equalsIgnoreCase("delete") || isBlogAuthor);
			});
			return isBlogAuthor || hasShareRights;
		});
	}

	public static PostService.StateType getStateType(HttpServerRequest request) {
		String s = request.params().get("state");
		PostService.StateType state;
		if (s == null || s.trim().isEmpty()) {
			state = PostService.StateType.PUBLISHED;
		} else {
			try {
				state = PostService.StateType.valueOf(s.toUpperCase());
			} catch (IllegalArgumentException | NullPointerException e) {
				state = PostService.StateType.PUBLISHED;
			}
		}
		return state;
	}

	private void executeCountQuery(final HttpServerRequest request, String collection, JsonObject query,
			final int expectedCountResult, final Handler<Boolean> handler) {
		request.pause();
		mongo.count(collection, query, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				request.resume();
				JsonObject res = event.body();
				handler.handle(res != null && "ok".equals(res.getString("status"))
						&& expectedCountResult == res.getInteger("count"));
			}
		});
	}

}
