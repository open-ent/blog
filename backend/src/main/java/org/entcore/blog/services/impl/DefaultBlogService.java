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

package org.entcore.blog.services.impl;

import com.mongodb.DBObject;
import com.mongodb.client.model.Filters;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.mongodb.MongoUpdateBuilder;
import fr.wseduc.webutils.Either;
import fr.wseduc.webutils.Utils;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.eventbus.Message;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.bson.conversions.Bson;
import org.entcore.blog.Blog;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.broker.api.dto.resources.ResourcesDeletedDTO;
import org.entcore.broker.api.publisher.BrokerPublisherFactory;
import org.entcore.broker.api.utils.AddressParameter;
import org.entcore.broker.proxy.ResourceBrokerPublisher;
import org.entcore.common.audience.AudienceHelper;
import org.entcore.common.explorer.IdAndVersion;
import org.entcore.common.explorer.IngestJobState;
import org.entcore.common.service.VisibilityFilter;
import org.entcore.common.service.impl.MongoDbSearchService;
import org.entcore.common.share.ShareNormalizer;
import org.entcore.common.user.UserInfos;
import org.entcore.common.utils.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

import static com.mongodb.client.model.Filters.*;
import static java.lang.System.currentTimeMillis;

public class DefaultBlogService implements BlogService{
	protected static final Logger log = LoggerFactory.getLogger(DefaultBlogService.class);
	protected static final String BLOG_COLLECTION = "blogs";

	private final MongoDb mongo;
	private final int pagingSize;
	private final int searchWordMinSize;
	private final PostService postService;
	private final BlogExplorerPlugin plugin;
	private final AudienceHelper audienceHelper;
	private final ResourceBrokerPublisher resourcePublisher;

	private final ShareNormalizer shareNormalizer;

	public DefaultBlogService(Vertx vertx, MongoDb mongo, PostService postService, int pagingSize, int searchWordMinSize,
							  BlogExplorerPlugin plugin, AudienceHelper audienceHelper) {
		this.mongo = mongo;
		this.plugin = plugin;
		this.pagingSize = pagingSize;
		this.postService = postService;
		this.searchWordMinSize = searchWordMinSize;
		this.audienceHelper = audienceHelper;
		this.shareNormalizer = new ShareNormalizer(this.plugin.getSecuredActions());
		// Initialize resource publisher for deletion notifications
        this.resourcePublisher = BrokerPublisherFactory.create(
            ResourceBrokerPublisher.class,
            vertx,
            new AddressParameter("application", Blog.APPLICATION)
        );
	}

	@Override
	public BlogExplorerPlugin getPlugin() {
		return plugin;
	}

	@Override
	public void create(final JsonObject blog, UserInfos author, boolean isPublic, final Handler<Either<String, JsonObject>> result) {
		final long version = currentTimeMillis();
		CommentType commentType = Utils.stringToEnum(blog.getString("comment-type", "").toUpperCase(),
				CommentType.NONE, CommentType.class);
		PublishType publishType = Utils.stringToEnum(blog.getString("publish-type", "").toUpperCase(),
				PublishType.RESTRAINT, PublishType.class);
		JsonObject now = MongoDb.nowISO();
		JsonObject owner = new JsonObject()
				.put("userId", author.getUserId())
				.put("username", author.getUsername())
				.put("login", author.getLogin());
		blog.put("created", now)
				.put("modified", now)
				.put("author", owner)
				.put("comment-type", commentType.name())
				.put("publish-type", publishType.name())
				.put("shared", new JsonArray());
		// get and remove folder field
		final Optional<Number> folderId = Optional.ofNullable(blog.getNumber("folder"));
		blog.remove("folder");
		List<String> fields = new ArrayList<>(FIELDS);
		if (isPublic) {
		    blog.put("visibility", VisibilityFilter.PUBLIC.name());
        } else {
		    blog.put("visibility", VisibilityFilter.OWNER.name());
		    blog.remove("slug");//remove field (sparse index)
			fields.remove("slug");
        }
		JsonObject b = Utils.validAndGet(blog, FIELDS, fields);
		if (validationError(result, b)) return;
		plugin.setIngestJobStateAndVersion(b, IngestJobState.TO_BE_SENT, version);
		plugin.create(author,b, false, folderId).onComplete((e) -> {
			if(e.succeeded()){
				result.handle(new Either.Right<>(blog.put("_id", e.result())));
			}else{
				result.handle(new Either.Left<>(e.cause().getMessage()));
				log.error("Failed to create blog: ", e.cause());
			}
		});
	}

	@Override
	public void update(UserInfos user, String blogId, JsonObject blog, final Handler<Either<String, JsonObject>> result) {
		final long version = currentTimeMillis();
		blog.put("modified", MongoDb.now());
		if (blog.getString("comment-type") != null) {
			try {
				CommentType.valueOf(blog.getString("comment-type").toUpperCase());
				blog.put("comment-type", blog.getString("comment-type").toUpperCase());
			} catch (IllegalArgumentException | NullPointerException e) {
				blog.remove("comment-type");
			}
		}
		if (blog.getString("publish-type") != null) {
			try {
				PublishType.valueOf(blog.getString("publish-type").toUpperCase());
				blog.put("publish-type", blog.getString("publish-type").toUpperCase());
			} catch (IllegalArgumentException | NullPointerException e) {
				blog.remove("publish-type");
			}
		}
		//
		String visibility = blog.getString("visibility", "");
		if(!VisibilityFilter.PUBLIC.name().equals(visibility)){
			blog.remove("slug");//remove field (sparse index)
		}
		//
		JsonObject b = Utils.validAndGet(blog, UPDATABLE_FIELDS, Collections.<String>emptyList());
		if (validationError(result, b)) return;
		final Bson query = eq("_id", blogId);
		MongoUpdateBuilder modifier = new MongoUpdateBuilder();
		for (String attr: b.fieldNames()) {
			modifier.set(attr, b.getValue(attr));
		}
		plugin.setIngestJobStateAndVersion(modifier, IngestJobState.TO_BE_SENT, version);
		mongo.update(BLOG_COLLECTION, MongoQueryBuilder.build(query), modifier.build(),event-> {
			final Either<String, JsonObject> either = Utils.validResult(event);
			if(either.isLeft()){
				log.error("Failed to update blog: ", either.left().getValue());
				result.handle(either);
			}else{
				blog.put("_id", blogId);
				plugin.setVersion(blog, version);
				plugin.notifyUpsert(user, blog).onComplete(e->{
					if(e.failed()){
						log.error("Failed to notify upsert blog: ", e.cause());
					}
					result.handle(either);
				});
			}
		});
	}

	@Override
	public void delete(UserInfos user, final String blogId, final Handler<Either<String, JsonObject>> result) {
		final long now = currentTimeMillis();
		final Bson q = eq("blog.$id", blogId);
		mongo.find("posts", MongoQueryBuilder.build(q), null, new JsonObject().put("_id", 1), findPostsResults -> {
			Either<String, JsonObject> validFindPostsResult = Utils.validResult(findPostsResults);
			if (validFindPostsResult.isRight()) {
				Set<String> ids = validFindPostsResult.right().getValue().getJsonArray("results").stream().map(r -> ((JsonObject) r).getString("_id")).collect(Collectors.toSet());
				audienceHelper.notifyResourcesDeletion("blog", "posts", ids)
						.onFailure(th -> log.error("Failed to notify audience of deletion of posts : " + ids, th));
				mongo.delete("posts", MongoQueryBuilder.build(q), deletePostsResult -> {
					Either<String, JsonObject> validatedResult = Utils.validResult(deletePostsResult);
					if (validatedResult.isRight()) {
						final Bson query = eq("_id", blogId);
						mongo.delete(BLOG_COLLECTION, MongoQueryBuilder.build(query), event -> {
							final Either<String, JsonObject> either = Utils.validResult(event);
							if(either.isLeft()){
								log.error("Failed to delete blog: ", either.left().getValue());
								result.handle(either);
							}else{
								// Notify both the explorer plugin and the broker about the deletion
                                final Future<Void> explorerNotif = plugin.notifyDeleteById(user, new IdAndVersion(blogId, now));
                                
								// Notify resource deletion via broker and dont wait for completion
                                final ResourcesDeletedDTO notification = ResourcesDeletedDTO.forSingleResource(blogId, Blog.BLOG_TYPE);
                                resourcePublisher.notifyResourcesDeleted(notification);
                                
                                // Wait for explorer notifications to complete
                                explorerNotif.onComplete(e -> {
                                    if(e.failed()){
                                        log.error("Failed to notify deletion: ", e.cause());
                                    }
                                    result.handle(either);
                                });
							}
						});
					} else {
						result.handle(validatedResult);
					}
				});
			} else {
				result.handle(validFindPostsResult);
			}
		});
	}

	@Override
	public void get(String blogId, final Handler<Either<String, JsonObject>> result) {
		final Bson query = eq("_id", blogId);
		mongo.findOne(BLOG_COLLECTION, MongoQueryBuilder.build(query),
				new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				final JsonObject body = event.body();
				if(body.containsKey("result")) {
					addNormalizedShares(body.getJsonObject("result"));
				}
				result.handle(Utils.validResult(event));
			}
		});
	}

	private JsonObject addNormalizedShares(final JsonObject blog) {
		if(blog != null) {
			shareNormalizer.addNormalizedRights(blog, e -> plugin.getCreatorForModel(e).map(UserInfos::getUserId));
		}
		return blog;
	}

	@Override
	public void getPublic(String slug, IdType type, Handler<Either<String, JsonObject>> result) {
		final Bson querySlug = eq(IdType.Slug.equals(type)?"slug":"_id", slug);
		mongo.findOne(BLOG_COLLECTION, MongoQueryBuilder.build(querySlug),event -> {
			Either<String,JsonObject> eitherBlog = Utils.validResult(event);
			if(eitherBlog.isRight()){
				JsonObject blog = eitherBlog.right().getValue();
				addNormalizedShares(blog);
				postService.count(blog.getString("_id"), PostService.StateType.PUBLISHED,eventCount->{
					if(eventCount.isRight()){
						blog.put("countAll", eventCount.right().getValue());
					}
					result.handle(eitherBlog);
				});
			}else{
				result.handle(eitherBlog);
			}
		});
	}

	public void isPublicBlog(String id, IdType type, Handler<Boolean> handler){
		if (id!=null) {
			final String prop = IdType.Slug.equals(type)?"slug":"_id";
			JsonObject query = MongoQueryBuilder.build(and(eq(prop, id), eq("visibility", VisibilityFilter.PUBLIC.name())));
			mongo.count(BLOG_COLLECTION, query, event -> {
				JsonObject res = (JsonObject)event.body();
				handler.handle(res != null && "ok".equals(res.getString("status")) && 1 == res.getInteger("count"));
			});
		} else {
			handler.handle(false);
		}
	}

	public void isBlogExists(Optional<String> blogId, String slug, Handler<Boolean> handler){
		Bson queryM = eq("slug", slug);
		if(blogId.isPresent()){
			queryM = and(queryM, not(eq("_id", blogId.get())));
		}
		JsonObject query = MongoQueryBuilder.build(queryM);
		mongo.count(BLOG_COLLECTION, query, event -> {
			JsonObject res = (JsonObject)event.body();
			handler.handle(res != null && "ok".equals(res.getString("status")) && 0 != res.getInteger("count"));
		});
	}

	@Override
	public void list(UserInfos user, final Integer page, final String search, final Handler<Either<String, JsonArray>> result) {

		List<Bson> groups = new ArrayList<>();
		groups.add(eq("userId", user.getUserId()));
		for (String gpId: user.getProfilGroupsIds()) {
			groups.add(eq("groupId", gpId));
		}
		final Bson rightQuery = or(
				eq("author.userId", user.getUserId()),
				elemMatch("shared", or(groups))
		);

		final Bson query;

		if (!StringUtils.isEmpty(search)) {
			final List<String> searchWords = checkAndComposeWordFromSearchText(search, this.searchWordMinSize);
			if (!searchWords.isEmpty()) {
				query = and(
					rightQuery,
					Filters.text(MongoDbSearchService.textSearchedComposition(searchWords))
				);
			} else {
				query = null;
				//empty result (no word to search)
				result.handle(new Either.Right<>(new JsonArray()));
				return;
			}
		} else {
			query = rightQuery;
		}
		JsonObject sort = new JsonObject().put("modified", -1);
		if (page != null && query != null) {
			final int skip = (0 == page) ? -1 : page * this.pagingSize;
			mongo.find(BLOG_COLLECTION, MongoQueryBuilder.build(query), sort, null, skip, this.pagingSize, this.pagingSize,
					new Handler<Message<JsonObject>>() {
						@Override
						public void handle(Message<JsonObject> event) {
							result.handle(Utils.validResults(event));
						}
					});
		} else if (query != null) {
			mongo.find(BLOG_COLLECTION, MongoQueryBuilder.build(query), sort, null,
					new Handler<Message<JsonObject>>() {
						@Override
						public void handle(Message<JsonObject> event) {
							result.handle(Utils.validResults(event));
						}
					});
		}
	}

	//TODO put this code in SearchUtils on entcore with (same code in searchengine app) and adding searchWordMinSize param
	public static List<String> checkAndComposeWordFromSearchText(final String searchText, final int searchWordMinSize) {
		final Set<String> searchWords = new HashSet<>();

		if (searchText != null) {
			//delete all useless spaces
			final String searchTextTreaty = searchText.replaceAll("\\s+", " ").trim();
			if (!searchTextTreaty.isEmpty()) {
				final List<String> words = Arrays.asList(searchTextTreaty.split(" "));
				//words search
				for (String w : words) {
					final String wTraity = w.replaceAll("(?!')\\p{Punct}", "");
					if (wTraity.length() >= searchWordMinSize) {
						searchWords.add(wTraity);
					}
				}
			}
		}
		return new ArrayList<>(searchWords);
	}

	private boolean validationError(Handler<Either<String, JsonObject>> result, JsonObject b) {
		if (b == null) {
			result.handle(new Either.Left<String, JsonObject>("Validation error : invalids fields."));
			return true;
		}
		return false;
	}

}
