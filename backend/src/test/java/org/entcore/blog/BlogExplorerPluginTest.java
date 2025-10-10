package org.entcore.blog;

import com.opendigitaleducation.explorer.ingest.IngestJobMetricsRecorderFactory;
import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.transformer.IContentTransformerClient;
import fr.wseduc.transformer.to.ContentTransformerRequest;
import fr.wseduc.transformer.to.ContentTransformerResponse;
import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Future;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.explorer.PostExplorerPlugin;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultBlogService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.blog.to.PostFilter;
import org.entcore.common.audience.AudienceHelper;
import org.entcore.common.editor.IContentTransformerEventRecorder;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.share.ShareService;
import org.entcore.common.user.UserInfos;
import org.entcore.test.TestHelper;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.Neo4jContainer;

import java.util.*;

@RunWith(VertxUnitRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class BlogExplorerPluginTest {
    static final String RIGHT = "org-entcore-blog-controllers-BlogController|get";
    private static final TestHelper test = TestHelper.helper();
    @ClassRule
    public static Neo4jContainer<?> neo4jContainer = test.database().createNeo4jContainer();
    @ClassRule
    public static ExplorerTestHelper explorerTest = new ExplorerTestHelper(BlogExplorerPlugin.APPLICATION);
    @ClassRule
    public static MongoDBContainer mongoDBContainer = test.database().createMongoContainer().withReuse(true);
    static BlogService blogService;
    static PostService postService;
    static BlogExplorerPlugin blogPlugin;
    static PostExplorerPlugin postPlugin;
    static IContentTransformerClient contentTransformerClient;
    static ShareService shareService;
    static final String application = BlogExplorerPlugin.APPLICATION;
    static final String resourceType = BlogExplorerPlugin.TYPE;
    static Map<String, Object> data = new HashMap<>();
    static final UserInfos user = test.directory().generateUser("user1");
    static final UserInfos user2 = test.directory().generateUser("user2");
    static AudienceHelper audienceHelper;

    @BeforeClass
    public static void setUp(TestContext context) throws Exception {
        IngestJobMetricsRecorderFactory.init(null, new JsonObject());
        test.database().initNeo4j(context, neo4jContainer);
        user.setLogin("user1");
        user2.setLogin("user2");
        explorerTest.start(context);
        test.database().initMongo(context, mongoDBContainer);
        MongoDbConf.getInstance().setCollection("blogs");
        MongoDb mongo = MongoDb.getInstance();
        final int POST_SEARCH_WORD = 4;
        final int BLOG_PAGING = 30;
        final int BLOG_SEARCH_WORD = 4;
        final Map<String, SecuredAction> securedActions = test.share().getSecuredActions(context);
        final IExplorerPluginCommunication communication = explorerTest.getCommunication();
        final MongoClient mongoClient = test.database().createMongoClient(mongoDBContainer);
        blogPlugin = new BlogExplorerPlugin(communication, mongoClient, securedActions);
        postPlugin = blogPlugin.postPlugin();
        audienceHelper = new AudienceHelper(test.vertx());
        postService = new DefaultPostService(mongo, POST_SEARCH_WORD, PostController.LIST_ACTION, postPlugin, new DummyContentTransformerClient(), IContentTransformerEventRecorder.noop, audienceHelper);
        blogService = new DefaultBlogService(mongo, postService, BLOG_PAGING, BLOG_SEARCH_WORD, blogPlugin, audienceHelper);
        shareService = blogPlugin.createMongoShareService(Blog.BLOGS_COLLECTION, securedActions, new HashMap<>());
    }

    static JsonObject createBlog(final String name) {
        return new JsonObject().put("title", name).put("description", "description"+name).put("slug", "slug"+name).put("thumbnail", "thumb"+name).put("comment-type", "IMMEDIATE");
    }

    static JsonObject createPost(final String name) {
        return new JsonObject().put("title", name).put("content", "description"+name).put("state", "PUBLISHED");
    }

    @Test
    public void step1ShouldCreateBlog(TestContext context) {
        final JsonObject b1 = createBlog("blog1");
        final Async async = context.async();
        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch0 -> {
            context.assertEquals(0, fetch0.size());
            blogService.create(b1, user, false, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(r -> {
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3->{
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            final JsonObject first = fetch1.getJsonObject(0);
                            context.assertEquals(b1.getString("title"), first.getString("name"));
                            context.assertEquals(user.getUserId(), first.getString("creatorId"));
                            context.assertEquals(user.getUserId(), first.getString("updaterId"));
                            context.assertEquals(application, first.getString("application"));
                            context.assertEquals(resourceType, first.getString("resourceType"));
                            context.assertEquals(b1.getString("description"), first.getString("contentHtml"));
                            context.assertEquals(user.getUsername(), first.getString("creatorName"));
                            context.assertEquals(user.getUsername(), first.getString("updaterName"));
                            context.assertFalse(first.getBoolean("public"));
                            context.assertFalse(first.getBoolean("trashed"));
                            context.assertNotNull(first.getNumber("createdAt"));
                            context.assertNotNull(first.getNumber("updatedAt"));
                            context.assertNotNull(first.getString("assetId"));
                            blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list ->{
                                context.assertEquals(1, list.size());
                                final JsonObject firstDb = list.getJsonObject(0);
                                data.put("ID1", firstDb.getString("_id"));
                                context.assertEquals(b1.getString("title"), firstDb.getString("title"));
                                context.assertEquals(b1.getString("description"), firstDb.getString("description"));
                                context.assertEquals(b1.getString("thumbnail"), firstDb.getString("thumbnail"));
                                context.assertEquals(b1.getBoolean("trashed"), firstDb.getBoolean("trashed"));
                                context.assertEquals(first.getString("assetId"), firstDb.getString("_id"));
                                context.assertNotNull(firstDb.getJsonObject("created").getNumber("$date"));
                                context.assertNotNull(firstDb.getJsonObject("modified").getNumber("$date"));
                                context.assertEquals(user.getUserId(), firstDb.getJsonObject("author").getString("userId"));
                                context.assertEquals(user.getUsername(), firstDb.getJsonObject("author").getString("username"));
                                context.assertEquals(user.getLogin(), firstDb.getJsonObject("author").getString("login"));
                                context.assertEquals(b1.getString("comment-type"), firstDb.getString("comment-type"));
                                context.assertEquals("RESTRAINT", firstDb.getString("publish-type"));
                                context.assertEquals("OWNER", firstDb.getString("visibility"));
                                async.complete();
                            })));
                        }));
                    }));
                }));
            })));
        }));
    }

    @Test
    public void step2ShouldUpdateBlog(TestContext context) {
        final Async async = context.async();
        blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list0 -> {
            context.assertEquals(1, list0.size());
            final JsonObject model = list0.getJsonObject(0);
            final String id = model.getString("_id");
            context.assertNotNull(id);
            final JsonObject b2 = createBlog("blog2").put("trashed", true).put("visibility", "PUBLIC");
            blogService.update(user2, id, b2, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(update->{
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            final JsonObject first = fetch1.getJsonObject(0);
                            context.assertEquals(b2.getString("title"), first.getString("name"));
                            context.assertEquals(user.getUserId(), first.getString("creatorId"));
                            context.assertEquals(user2.getUserId(), first.getString("updaterId"));
                            context.assertEquals(application, first.getString("application"));
                            context.assertEquals(resourceType, first.getString("resourceType"));
                            context.assertEquals(b2.getString("description"), first.getString("contentHtml"));
                            context.assertEquals(user.getUsername(), first.getString("creatorName"));
                            context.assertEquals(user2.getUsername(), first.getString("updaterName"));
                            context.assertTrue(first.getBoolean("public"));
                            context.assertTrue(first.getBoolean("trashed"));
                            context.assertNotNull(first.getNumber("createdAt"));
                            context.assertNotNull(first.getNumber("updatedAt"));
                            context.assertEquals(id, first.getString("assetId"));blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list ->{
                                context.assertEquals(1, list.size());
                                final JsonObject firstDb = list.getJsonObject(0);
                                context.assertEquals(b2.getString("title"), firstDb.getString("title"));
                                context.assertEquals(b2.getString("description"), firstDb.getString("description"));
                                context.assertEquals(b2.getString("thumbnail"), firstDb.getString("thumbnail"));
                                context.assertEquals(b2.getBoolean("trashed"), firstDb.getBoolean("trashed"));
                                context.assertEquals(first.getString("assetId"), firstDb.getString("_id"));
                                context.assertNotNull(firstDb.getJsonObject("created").getNumber("$date"));
                                context.assertNotNull(firstDb.getJsonObject("modified").getNumber("$date"));
                                context.assertEquals(user.getUserId(), firstDb.getJsonObject("author").getString("userId"));
                                context.assertEquals(user.getUsername(), firstDb.getJsonObject("author").getString("username"));
                                context.assertEquals(user.getLogin(), firstDb.getJsonObject("author").getString("login"));
                                context.assertEquals(b2.getString("comment-type"), firstDb.getString("comment-type"));
                                context.assertEquals("RESTRAINT", firstDb.getString("publish-type"));
                                context.assertEquals("PUBLIC", firstDb.getString("visibility"));
                                async.complete();
                            })));
                        }));
                    }));
                }));
            })));
        })));
    }

    @Test
    public void step3ShouldCreatePost(TestContext context) {
        final Async async = context.async();
        context.assertNotNull(data.get("ID1"));
        final String id = (String) data.get("ID1");
        final JsonObject post1 = createPost("post1");
        postService.create(id, post1, user,  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(create -> {
            final String postId = create.getString("_id");
            data.put("POSTID1", postId);
            context.assertNotNull(postId);
            postPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                    explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                        context.assertEquals(1, fetch1.size());
                        final JsonObject postES = fetch1.getJsonObject(0);
                        final JsonObject subResource = postES.getJsonArray("subresources").getJsonObject(0);
                        context.assertEquals(post1.getString("content"), subResource.getString("content"));
                        postService.list(id, user, 0, 10, "", new HashSet<>(), test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(listPost -> {
                            context.assertEquals(1, listPost.size());
                            final JsonObject postModel = listPost.getJsonObject(0);
                            context.assertEquals(postId, postModel.getString("_id"));
                            context.assertEquals(post1.getString("title"), postModel.getString("title"));
                            context.assertNotNull(postModel.getString("state"));
                            context.assertNotNull(postModel.getValue("created"));
                            context.assertNotNull(postModel.getValue("modified"));
                            context.assertNotNull(postModel.getValue("author"));
                            context.assertNotNull(postModel.getNumber("views"));
                            postService.get(new PostFilter(id, postId, false, PostService.StateType.DRAFT), null)
                            .onSuccess(postGet -> {
                                context.assertEquals("<p>clean html</p>"+post1.getString("content"), postGet.getString("content"));
                                async.complete();
                            })
                            .onFailure(context::fail);
                        })), null);
                    }));
                }));
            }));
        })), null);
    }

    @Test
    public void step4ShouldUpdatePost(TestContext context) {
        final Async async = context.async();
        context.assertNotNull(data.get("ID1"));
        context.assertNotNull(data.get("POSTID1"));
        final String blogId = (String) data.get("ID1");
        final String postId = (String) data.get("POSTID1");
        final JsonObject post2 = createPost("post2");
        postService.update(postId, post2, user,  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(create -> {
            postPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                    explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                        context.assertEquals(1, fetch1.size());
                        final JsonObject postES = fetch1.getJsonObject(0);
                        final JsonObject subResource = postES.getJsonArray("subresources").getJsonObject(0);
                        context.assertEquals(post2.getString("content"), subResource.getString("content"));
                        postService.list(blogId,user, 0,10, null, new HashSet<>(), test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(listPost -> {
                            context.assertEquals(1, listPost.size());
                            final JsonObject postModel = listPost.getJsonObject(0);
                            context.assertEquals(postId, postModel.getString("_id"));
                            context.assertEquals(post2.getString("title"), postModel.getString("title"));
                            context.assertNotNull(postModel.getString("state"));
                            context.assertNotNull(postModel.getValue("created"));
                            context.assertNotNull(postModel.getValue("modified"));
                            context.assertNotNull(postModel.getValue("author"));
                            context.assertNotNull(postModel.getNumber("views"));
                            async.complete();
                        })), null);
                    }));
                }));
            }));
        })), null);
    }

    @Test
    public void step5ShouldBulkUpdatePost(TestContext context) {
        final Async async = context.async();
        context.assertNotNull(data.get("ID1"));
        context.assertNotNull(data.get("POSTID1"));
        final String blogId = (String) data.get("ID1");
        final String postId = (String) data.get("POSTID1");
        final JsonObject post3 = createPost("post3").put("_id", postId).put("blog", new JsonObject().put("$id", blogId));
        final List<JsonObject> posts = new ArrayList<>();
        posts.add(post3);
        postService.updateAllContents(user, posts, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(create -> {
            postPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                    postPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r4a-> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            final JsonObject postES = fetch1.getJsonObject(0);
                            final JsonObject subResource = postES.getJsonArray("subresources").getJsonObject(0);
                            context.assertEquals(post3.getString("content"), subResource.getString("contentHtml"));
                            postService.list(blogId, user, 0, 10, null, new HashSet<>(), test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(listPost -> {
                                context.assertEquals(1, listPost.size());
                                final JsonObject postModel = listPost.getJsonObject(0);
                                context.assertEquals(postId, postModel.getString("_id"));
                                context.assertNotNull(postModel.getString("state"));
                                context.assertNotNull(postModel.getValue("created"));
                                context.assertNotNull(postModel.getValue("modified"));
                                context.assertNotNull(postModel.getValue("author"));
                                context.assertNotNull(postModel.getNumber("views"));
                                async.complete();
                            })), null);
                        }));
                    }));
                }));
            }));
        })));
    }

    @Test
    public void step6ShouldExploreBlogByUser(TestContext context) {
        final Async async = context.async(3);
        final UserInfos user1 = test.directory().generateUser("user_share1", "group_share1");
        user1.setLogin("user1");
        final String blogId = (String) data.get("ID1");
        test.directory().createActiveUser(user1).compose(e->{
            //load documents
            return explorerTest.fetch(user1, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                context.assertEquals(0, fetch1.size());
            }));
        }).compose(e->{
            final JsonObject shareUser = test.share().createShareForUser(user1.getUserId(), Arrays.asList(RIGHT));
            return shareService.share(user, blogId, shareUser, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(share->{
                context.assertTrue(share.containsKey("notify-timeline-array"));
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user1, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            blogPlugin.getShareInfo(blogId).onComplete(context.asyncAssertSuccess(shareEvt->{
                                context.assertEquals(1, shareEvt.size());
                                context.assertTrue(shareEvt.contains("user:user_share1:read"));
                                async.complete();
                            }));
                        }));
                    }));
                }));
            })));
        });
    }

    @Test
    public void step7ShouldExploreBlogByGroup(TestContext context) {
        final Async async = context.async(3);
        final UserInfos user2 = test.directory().generateUser("user_share2", "group_share2");
        user2.setLogin("user2");
        final String blogId = (String) data.get("ID1");
        test.directory().createActiveUser(user2).compose(e->{
            //load documents
            return test.directory().createGroup("group_share2", "group_share2").compose(ee->{
                return test.directory().attachUserToGroup("user_share2", "group_share2");
            }).compose(ee->{
                return explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                    context.assertEquals(0, fetch1.size());
                }));
            });
        }).compose(e->{
            final JsonObject shareUser = test.share().createShareForGroup("group_share2", Arrays.asList(RIGHT));
            return shareService.share(user, blogId, shareUser, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(share->{
                context.assertTrue(share.containsKey("notify-timeline-array"));
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            blogPlugin.getShareInfo(blogId).onComplete(context.asyncAssertSuccess(shareEvt->{
                                context.assertEquals(1, shareEvt.size());
                                context.assertTrue(shareEvt.contains("group:group_share2:read"));
                                async.complete();
                            }));
                        }));
                    }));
                }));
            })));
        });
    }

    @Test
    public void step8ShouldDeletePost(TestContext context) {
        final Async async = context.async();
        context.assertNotNull(data.get("ID1"));
        context.assertNotNull(data.get("POSTID1"));
        final String blogId = (String) data.get("ID1");
        final String postId = (String) data.get("POSTID1");
        final JsonObject post2 = createPost("post2");
        postService.delete(user, blogId, postId,  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(create -> {
            postPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                    explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                        context.assertEquals(1, fetch1.size());
                        final JsonObject postES = fetch1.getJsonObject(0);
                        final JsonObject subResource = postES.getJsonArray("subresources").getJsonObject(0);
                        context.assertEquals("", subResource.getString("contentHtml"));
                        postService.list(blogId,user, 0,10, null, new HashSet<>(), test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(listPost -> {
                            context.assertEquals(0, listPost.size());
                            async.complete();
                        })), null);
                    }));
                }));
            }));
        })));
    }

    @Test
    public void step9ShouldDeleteBlog(TestContext context) {
        final Async async = context.async();
        blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list -> {
            context.assertEquals(1, list.size());
            final JsonObject firstDb = list.getJsonObject(0);
            final String id = firstDb.getString("_id");
            context.assertNotNull(id);
            blogService.delete(user2, id, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(update->{
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(0, fetch1.size());
                            async.complete();
                        }));
                    }));
                }));
            })));
        })));
    }

    static class DummyContentTransformerClient implements IContentTransformerClient {

        @Override
        public Future<ContentTransformerResponse> transform(ContentTransformerRequest contentTransformerRequest) {
            return Future.succeededFuture(new ContentTransformerResponse(1, contentTransformerRequest.getHtmlContent(), null, contentTransformerRequest.getHtmlContent(), "<p>clean html</p>"+contentTransformerRequest.getHtmlContent(), null));
        }
    }
}
