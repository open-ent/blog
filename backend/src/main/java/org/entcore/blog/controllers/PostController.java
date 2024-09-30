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

package org.entcore.blog.controllers;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.rs.*;
import fr.wseduc.security.ActionType;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.http.BaseController;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.Handler;
import io.vertx.core.MultiMap;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import org.entcore.blog.Blog;
import org.entcore.blog.security.BlogResourcesProvider;
import org.entcore.blog.security.filter.comment.*;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.BlogTimelineService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultBlogTimelineService;
import org.entcore.blog.to.PostFilter;
import org.entcore.blog.to.PostProjection;
import org.entcore.common.events.EventHelper;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.neo4j.Neo;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.entcore.common.utils.StringUtils;
import org.vertx.java.core.http.RouteMatcher;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.entcore.common.http.response.DefaultResponseHandler.*;
import static org.entcore.common.user.UserUtils.getUserInfos;


public class PostController extends BaseController {
	public static final String LIST_ACTION = "org-entcore-blog-controllers-PostController|list";
	public static final String SUBMIT_ACTION = "org-entcore-blog-controllers-PostController|submit";
	private BlogTimelineService timelineService;
	private int pagingSize;
	private final EventHelper eventHelper;
	private final PostService post;
	private final BlogService blogService;
	private static final String RESOURCE_NAME = "blog_post";

	public PostController(final BlogService blogService, final PostService post){
		this.post = post;
		this.blogService = blogService;
		final EventStore eventStore = EventStoreFactory.getFactory().getEventStore(Blog.class.getSimpleName());
		this.eventHelper = new EventHelper(eventStore);
	}

	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
			Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super.init(vertx, config, rm, securedActions);
		MongoDb mongo = MongoDb.getInstance();
		this.timelineService = new DefaultBlogTimelineService(vertx, eb, config, new Neo(vertx, eb, log), mongo);
		this.pagingSize = config.getInteger("post-paging-size", 20);
	}

	// TODO improve fields matcher and validater
	@Post("/post/:blogId")
	@SecuredAction(value = "blog.contrib", type = ActionType.RESOURCE)
	public void create(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
			public void handle(final JsonObject data) {
				UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
					@Override
					public void handle(final UserInfos user) {
						if (user != null) {
							final Handler<Either<String, JsonObject>> handler = eventHelper.onCreateResource(request, RESOURCE_NAME, defaultResponseHandler(request));
							post.create(blogId, data, user, handler, request);
						} else {
							unauthorized(request);
						}
					}
				});
			}
		});
	}

	@Put("/post/:blogId/:postId")
	@SecuredAction(value = "blog.contrib", type = ActionType.RESOURCE)
	public void update(final HttpServerRequest request) {
		final String postId = request.params().get("postId");
		if (postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}

		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
						public void handle(final JsonObject data) {
							post.update(postId, data, user, defaultResponseHandler(request), request);
						}
					});
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Delete("/post/:blogId/:postId")
	@SecuredAction(value = "blog.contrib", type = ActionType.RESOURCE)
	public void delete(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String postId = request.params().get("postId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		if (postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		UserUtils.getUserInfos(eb, request, user-> {
			if (user != null) {
				post.delete(user, blogId, postId, event -> {
					if (event.isRight()) {
						renderJson(request, event.right().getValue(), 204);
					} else {
						JsonObject error = new JsonObject().put("error", event.left().getValue());
						renderJson(request, error, 400);
					}
				});
			} else {
				unauthorized(request);
			}
		});
	}

	@ApiDoc("Gets a post by id iff the post belongs to the blog whose id has been specified in blogId parameter and " +
			"if the given state is the expected one. " +
			"The query param originalFormat is to be set to true if the content field of the returned post must be in its original (i.e." +
			"if we want the content unaltered by the rich content converter) ")
	@Get("/post/:blogId/:postId")
	@SecuredAction(value = "blog.read", type = ActionType.RESOURCE)
	public void get(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String postId = request.params().get("postId");
		final boolean originalFormat = "true".equalsIgnoreCase(request.params().get("originalFormat"));
		if (blogId == null || blogId.trim().isEmpty() || postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		final PostFilter filter = new PostFilter(blogId, postId, originalFormat, BlogResourcesProvider.getStateType(request));
		post.get(filter, request).onComplete(defaultAsyncResultResponseHandler(request));
	}

	/**
	 * <h2>Description</h2>
	 * Fetch all the posts of a blog.
	 * <h2>GET Params</h2>
	 * <ul>
	 *   <li>postId: {@code string}, default {@code null}, id of the unique post to fetch</li>
	 *   <li>content: {@code boolean}, default {@code false}, {@code true} if we want to fetch the content of the posts, {@code false}
	 *   otherwise</li>
	 *   <li>comments: {@code boolean}, default is the value of {@code content}, {@code true} if we want to fetch the comments of the posts, {@code false}
	 *   otherwise</li>
	 *   <li>nbComments: {@code boolean}, default {@code false}, {@code true} if we want to fetch the number of comments of the posts, {@code false}
	 *   otherwise</li>
	 *   <li>page: {@code int}, default: {@code null}, index of the page to fetch</li>
	 *   <li>pageSize: {@code int}, default: {@code null}, number of elements per page</li>
	 * </ul>
	 * @param request
	 */
	@Get("/post/list/all/:blogId")
	@SecuredAction(value = "blog.read", type = ActionType.RESOURCE)
	public void list(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		if (blogId == null || blogId.trim().isEmpty()) {
			badRequest(request);
			return;
		}

		final String postId = request.params().get("postId");
		final Integer page;

		try {
			page = (request.params().get("page") != null) ? Integer.parseInt(request.params().get("page")) : null;
		} catch (NumberFormatException e) {
			badRequest(request, e.getMessage());
			return;
		}

		final int pagingSize;
		if(page == null) {
			pagingSize = 0;
		} else if(request.params().get("pageSize") != null){
			try {
				pagingSize = Integer.parseInt(request.params().get("pageSize"));
			} catch (NumberFormatException e) {
				badRequest(request, e.getMessage());
				return;
			}
		} else {
			pagingSize = this.pagingSize;
		}



		final PostProjection projection = parsePostProjection(request);

		final String search = request.params().get("search");

		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					if (!StringUtils.isEmpty(postId)) {
						post.listOne(blogId, postId, user, arrayResponseHandler(request));
					} else if (request.params().get("state") == null) {
						final String statesParam = request.params().get("states");
						final Set<String> states = new HashSet<String>();
						if (!StringUtils.isEmpty(statesParam)) {
							states.addAll(StringUtils.split(statesParam, ","));
						}
						post.list(blogId, user, page, pagingSize, search, states, projection, arrayResponseHandler(request), request);
					} else {
						post.list(blogId, BlogResourcesProvider.getStateType(request), user, page, pagingSize, search,
								arrayResponseHandler(request));
					}
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Put("/post/submit/:blogId/:postId")
	@SecuredAction(value = "blog.contrib", type = ActionType.RESOURCE)
	public void submit(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String postId = request.params().get("postId");
		if (blogId == null || blogId.trim().isEmpty() || postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					post.submit(blogId, postId, user, new Handler<Either<String, JsonObject>>() {
						@Override
						public void handle(Either<String, JsonObject> event) {
							if (event.isRight()) {
								if ("PUBLISHED".equals(event.right().getValue().getString("state"))) {
									timelineService.notifyPublishPost(request, blogId, postId, user,
											pathPrefix + "#/view/" + blogId);
								} else if ("SUBMITTED".equals(event.right().getValue().getString("state"))) {
									timelineService.notifySubmitPost(request, blogId, postId, user,
											pathPrefix + "#/view/" + blogId);
								}
								renderJson(request, event.right().getValue());
							} else {
								JsonObject error = new JsonObject().put("error", event.left().getValue());
								renderJson(request, error, 400);
							}
						}
					});
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Put("/post/publish/:blogId/:postId")
	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	public void publish(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String postId = request.params().get("postId");
		if (blogId == null || blogId.trim().isEmpty() || postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		post.publish(blogId, postId, new Handler<Either<String, JsonObject>>() {
			@Override
			public void handle(Either<String, JsonObject> event) {
				if (event.isRight()) {
					getUserInfos(eb, request, new Handler<UserInfos>() {
						@Override
						public void handle(UserInfos user) {
							timelineService.notifyPublishPost(request, blogId, postId, user,
									pathPrefix + "#/view/" + blogId);
						}
					});
					renderJson(request, event.right().getValue());
				} else {
					JsonObject error = new JsonObject().put("error", event.left().getValue());
					renderJson(request, error, 400);
				}
			}
		});
	}

	@Put("/post/unpublish/:blogId/:postId")
	@SecuredAction(value = "blog.contrib", type = ActionType.RESOURCE)
	public void unpublish(final HttpServerRequest request) {
		final String postId = request.params().get("postId");
		if (postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		post.unpublish(postId, defaultResponseHandler(request));
	}

	@Post("/comment/:blogId/:postId")
	@SecuredAction(value = "blog.comment", type = ActionType.RESOURCE)
	public void comment(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String postId = request.params().get("postId");
		if (blogId == null || blogId.trim().isEmpty() || postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
			public void handle(final JsonObject data) {
				UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
					@Override
					public void handle(final UserInfos user) {
						if (user != null) {
							Handler<Either<String, JsonObject>> notifyHandler = new Handler<Either<String, JsonObject>>() {
								@Override
								public void handle(Either<String, JsonObject> event) {
									if (event.isRight()) {
										timelineService.notifyPublishComment(request, blogId, postId, user,
												pathPrefix + "#/view/" + blogId);
										renderJson(request, event.right().getValue());
									} else {
										JsonObject error = new JsonObject().put("error", event.left().getValue());
										renderJson(request, error, 400);
									}
								}
							};
							post.addComment(blogId, postId, data.getString("comment"), user, notifyHandler);
						} else {
							unauthorized(request);
						}
					}
				});
			}
		});
	}

	@Put("/comment/:blogId/:postId/:commentId")
	@SecuredAction(value = "blog.comment", type = ActionType.RESOURCE)
	@ResourceFilter(CommentAuthorFilter.class)
	public void updateComment(final HttpServerRequest request) {
		final String postId = request.params().get("postId");
		final String commentId = request.params().get("commentId");
		if (postId == null || postId.trim().isEmpty() || commentId == null || commentId.trim().isEmpty()) {
			badRequest(request);
			return;
		}

		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					RequestUtils.bodyToJson(request, new Handler<JsonObject>() {
						public void handle(final JsonObject data) {
							post.updateComment(postId, commentId, data.getString("comment"), user, defaultResponseHandler(request));
						}
					});
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Delete("/comment/:blogId/:postId/:commentId")
	@SecuredAction(value = "blog.comment", type = ActionType.RESOURCE)
	@ResourceFilter(CommentAuthorOrManagerFilter.class)
	public void deleteComment(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String commentId = request.params().get("commentId");
		if (blogId == null || blogId.trim().isEmpty() || commentId == null || commentId.trim().isEmpty()) {
			badRequest(request);
			return;
		}

		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					post.deleteComment(blogId, commentId, user, defaultResponseHandler(request));
				} else {
					unauthorized(request);
				}
			}
		});
	}

	@Get("/comments/:blogId/:postId")
	@SecuredAction(value = "blog.read", type = ActionType.RESOURCE)
	public void comments(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String postId = request.params().get("postId");
		if (blogId == null || blogId.trim().isEmpty() || postId == null || postId.trim().isEmpty()) {
			badRequest(request);
			return;
		}

		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					post.listComment(blogId, postId, user, arrayResponseHandler(request));
				} else {
					unauthorized(request);
				}
			}
		});
	}

//	@Put("/comment/:blogId/:postId/:commentId") /* en conflit avec updateComment */
//	@SecuredAction(value = "blog.manager", type = ActionType.RESOURCE)
	@Deprecated
	public void publishComment(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String commentId = request.params().get("commentId");
		if (blogId == null || blogId.trim().isEmpty() || commentId == null || commentId.trim().isEmpty()) {
			badRequest(request);
			return;
		}
		post.publishComment(blogId, commentId, defaultResponseHandler(request));
	}

	@Get("/pub/posts/:blogId")
	public void getPublicBlogPosts(final HttpServerRequest request) {
		final String blogId = request.params().get("blogId");
		final String postId = request.params().get("postId");
		blogService.isPublicBlog(blogId, BlogService.IdType.Id, ev->{
			if(!ev){
				unauthorized(request);
				return;
			}
			if (!StringUtils.isEmpty(postId)) {
				post.listOnePublic(blogId, postId, request, arrayResponseHandler(request));
				return;
			}
			final Integer page;
			try {
				page = (request.params().get("page") != null) ? Integer.parseInt(request.params().get("page")) : null;
			} catch (NumberFormatException e) {
				badRequest(request, e.getMessage());
				return;
			}
			final int pagingSize = (page == null) ? 0 : this.pagingSize;
			final String search = request.params().get("search");
			post.listPublic(blogId, page, pagingSize, search, request, arrayResponseHandler(request));
		});
	}

	private PostProjection parsePostProjection(final HttpServerRequest request) {
		final MultiMap params = request.params();
		final boolean withContent = "true".equals(params.get("content"));
		final boolean withComments = params.contains("comments") ? "true".equals(params.get("comments")) : withContent;
		final boolean withNbComments = "true".equals(request.params().get("nbComments"));
		return new PostProjection(
				withContent, withComments, withNbComments
		);
	}

}
