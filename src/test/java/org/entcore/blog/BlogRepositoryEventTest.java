package org.entcore.blog;

import com.opendigitaleducation.explorer.ingest.IngestJobMetricsRecorderFactory;
import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.explorer.PostExplorerPlugin;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.BlogRepositoryEvents;
import org.entcore.blog.services.impl.DefaultBlogService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.common.explorer.IExplorerPluginClient;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.explorer.impl.ExplorerRepositoryEvents;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.share.ShareService;
import org.entcore.common.user.UserInfos;
import org.entcore.common.utils.Config;
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
import java.util.concurrent.atomic.AtomicInteger;

@RunWith(VertxUnitRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class BlogRepositoryEventTest {
    static Logger log = LoggerFactory.getLogger(BlogRepositoryEventTest.class);
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
    static ShareService shareService;
    static final String application = BlogExplorerPlugin.APPLICATION;
    static final String resourceType = BlogExplorerPlugin.TYPE;
    static Map<String, Object> data = new HashMap<>();
    static final UserInfos user = test.directory().generateUser("user1");
    static ExplorerRepositoryEvents repositoryEvents;

    @BeforeClass
    public static void setUp(TestContext context) throws Exception {
        IngestJobMetricsRecorderFactory.init(test.vertx(), new JsonObject());
        test.database().initNeo4j(context, neo4jContainer);
        user.setLogin("user1");
        explorerTest.start(context);
        test.database().initMongo(context, mongoDBContainer);
        MongoDbConf.getInstance().setCollection("blogs");
        MongoDb mongo = MongoDb.getInstance();
        final int POST_SEARCH_WORD = 4;
        final int BLOG_PAGING = 30;
        final int BLOG_SEARCH_WORD = 4;
        final Map<String, SecuredAction> securedActions = test.share().getSecuredActions(context);
        final IExplorerPluginCommunication communication = explorerTest.getCommunication();
        final Vertx vertx = communication.vertx();
        final MongoClient mongoClient = test.database().createMongoClient(mongoDBContainer);
        blogPlugin = new BlogExplorerPlugin(communication, mongoClient, securedActions);
        postPlugin = blogPlugin.postPlugin();
        postService = new DefaultPostService(mongo, POST_SEARCH_WORD, PostController.LIST_ACTION, postPlugin);
        blogService = new DefaultBlogService(mongo, postService, BLOG_PAGING, BLOG_SEARCH_WORD, blogPlugin);
        shareService = blogPlugin.createMongoShareService(Blog.BLOGS_COLLECTION, securedActions, new HashMap<>());
        final IExplorerPluginClient mainClient = IExplorerPluginClient.withBus(vertx, Blog.APPLICATION, Blog.BLOG_TYPE);
        final Map<String, IExplorerPluginClient> pluginClientPerCollection = new HashMap<>();
        pluginClientPerCollection.put(Blog.BLOGS_COLLECTION, mainClient);
        pluginClientPerCollection.put(Blog.POSTS_COLLECTION, IExplorerPluginClient.withBus(vertx, Blog.APPLICATION, Blog.POST_TYPE));
        // init conf before repositoryevent
        Config.getInstance().setConfig(new JsonObject().put("path-prefix", "blog"));
        repositoryEvents = new ExplorerRepositoryEvents(new BlogRepositoryEvents(vertx), pluginClientPerCollection, mainClient);
        blogPlugin.start();
    }

    /**
     * <b>This test assert that a blog is upserted in OpenSearch when a resource is imported through RepositoryEvent</b>
     * <ul>
     *     <li>Import a blog for user1</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Assert that the blog has been created</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void step1ShouldUpsertOnImport(TestContext context) {
        final Async async = context.async();
        final String importPath = this.getClass().getClassLoader().getResource("import/Blog/").getPath();
        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch0 -> {
            context.assertEquals(0, fetch0.size());
            repositoryEvents.importResources("id", user.getUserId(), "user1", "user1", importPath, "fr", "host", false, onFinish -> {
            });
        }));
        repositoryEvents.setOnReindex(context.asyncAssertSuccess(e -> {
            blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                    explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                        log.info("Number of blog visible after import:" + fetch1.size());
                        context.assertEquals(1, fetch1.size());
                        final String id = fetch1.getJsonObject(0).getString("assetId");
                        context.assertNotNull(id);
                        data.put("ID1", id);
                        async.complete();
                    }));
                }));
            }));
        }));
    }

    /**
     * <b>This test assert that a blog1 has been shared to group1</b>
     * <ul>
     *     <li>Create user2</li>
     *     <li>Create group1</li>
     *     <li>Add user2 to group1</li>
     *     <li>Share blog1 to group1</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Assert that the blog1 has been shared to group1</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void step2ShouldShareBlogToGroup1(TestContext context) {
        final Async async = context.async(3);
        final UserInfos user2 = test.directory().generateUser("user2", "group1");
        user2.setLogin("user2");
        final String blogId = (String) data.get("ID1");
        test.directory().createActiveUser(user2).compose(e -> {
            //load documents
            return test.directory().createGroup("group1", "group1").compose(ee -> {
                return test.directory().attachUserToGroup("user2", "group1");
            }).compose(ee -> {
                return explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                    context.assertEquals(0, fetch1.size());
                }));
            });
        }).compose(e -> {
            final JsonObject shareUser = test.share().createShareForGroup("group1", Arrays.asList(RIGHT));
            return shareService.share(user, blogId, shareUser, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(share -> {
                context.assertTrue(share.containsKey("notify-timeline-array"));
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            log.info("Number of blog visible after sgare to group1:" + fetch1.size());
                            context.assertEquals(1, fetch1.size());
                            context.assertTrue(fetch1.getJsonObject(0).getJsonArray("rights").contains("group:group1:read"));
                            async.complete();
                        }));
                    }));
                }));
            })));
        });
    }

    /**
     * <b>This test assert that a blog is upserted on OpenSearch when a group in shares is deleted through RepositoryEvent</b>
     * <ul>
     *     <li>Assert that user2 see blog1 through group1</li>
     *     <li>Delete group1</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Assert that blog is not visible anymore by user2</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void step3ShouldUpsertOnDeleteGroup(TestContext context) {
        final Async async = context.async();
        final UserInfos user2 = test.directory().generateUser("user2", "group1");
        explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
            context.assertEquals(1, fetch1.size());
            context.assertTrue(fetch1.getJsonObject(0).getJsonArray("rights").contains("group:group1:read"));
            repositoryEvents.deleteGroups(new JsonArray().add(new JsonObject().put("group", "group1")));
        }));
        repositoryEvents.setOnReindex(context.asyncAssertSuccess(e -> {
            blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                    explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                        log.info("Number of blog visible after delete group1:" + fetch1.size());
                        context.assertEquals(0, fetch1.size());
                        async.complete();
                    }));
                }));
            }));
        }));
    }

    /**
     * <b>This test assert that a blog1 has been shared to user3</b>
     * <ul>
     *     <li>Create user3</li>
     *     <li>Share blog1 to user3</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Assert that the blog1 has been shared to user3</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void step4ShouldShareBlogToToUser3(TestContext context) {
        final Async async = context.async(3);
        final UserInfos user3 = test.directory().generateUser("user3", "group3");
        user3.setLogin("user3");
        final String blogId = (String) data.get("ID1");
        test.directory().createActiveUser(user3).compose(e -> {
            //load documents
            return explorerTest.fetch(user3, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                context.assertEquals(0, fetch1.size());
            }));
        }).compose(e -> {
            final JsonObject shareUser = test.share().createShareForUser(user3.getUserId(), Arrays.asList(RIGHT));
            return shareService.share(user, blogId, shareUser, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(share -> {
                context.assertTrue(share.containsKey("notify-timeline-array"));
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user3, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            log.info("Number of blog visible after share to user3:" + fetch1.size());
                            context.assertEquals(1, fetch1.size());
                            context.assertTrue(fetch1.getJsonObject(0).getJsonArray("rights").contains("user:user3:read"));
                            async.complete();
                        }));
                    }));
                }));
            })));
        });
    }

    /**
     * <b>This test assert that a blog is upsert in OpenSearch when a user in shares is deleted through RepositoryEvent</b>
     * <ul>
     *     <li>Assert that user3 see blog1</li>
     *     <li>Delete user3</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Assert that blog is not visible anymore by user3</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void step5ShouldUpsertOnDeleteUser(TestContext context) {
        final Async async = context.async();
        final UserInfos user3 = test.directory().generateUser("user3", "group3");
        explorerTest.fetch(user3, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
            context.assertEquals(1, fetch1.size());
            context.assertTrue(fetch1.getJsonObject(0).getJsonArray("rights").contains("user:user3:read"));
            repositoryEvents.deleteUsers(new JsonArray().add(new JsonObject().put("id", "user3")));
        }));
        repositoryEvents.setOnReindex(context.asyncAssertSuccess(e -> {
            blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                    explorerTest.fetch(user3, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                        log.info("Number of blog visible after delete user3:" + fetch1.size());
                        context.assertEquals(0, fetch1.size());
                        async.complete();
                    }));
                }));
            }));
        }));
    }

    /**
     * <b>This test assert that a blog is deleted in OpenSearch when the owner is deleted through RepositoryEvent</b>
     * <ul>
     *     <li>Assert that user1 see blog1</li>
     *     <li>Delete user</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Assert that blog is not visible by owner anymore</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void step6ShouldDeleteOnDeleteOwner(TestContext context) {
        final Async async = context.async();
        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
            context.assertEquals(1, fetch1.size());
            repositoryEvents.deleteUsers(new JsonArray().add(new JsonObject().put("id", "user1")));
        }));
        AtomicInteger count = new AtomicInteger(0);
        //callback update then delete
        repositoryEvents.setOnReindex(ee -> {
            int countInt = count.incrementAndGet();
            if (countInt == 2) {
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.ingestJobWaitPending().onComplete(context.asyncAssertSuccess(r5 -> {
                            explorerTest.fetch(user, application, explorerTest.createSearch().setWaitFor(true)).onComplete(context.asyncAssertSuccess(fetch1 -> {
                                log.info("Number of blog visible after delete owner:" + fetch1.size());
                                context.assertEquals(0, fetch1.size());
                                async.complete();
                            }));
                        }));
                    }));
                }));
            }
        });
    }
}
