package org.entcore.blog.explorer;

import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;
import org.entcore.blog.Blog;
import org.entcore.common.explorer.*;
import org.entcore.common.user.UserInfos;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class PostExplorerPlugin extends ExplorerPluginResourceCrud {
    public static final String APPLICATION = Blog.APPLICATION;
    public static final String TYPE = Blog.BLOG_TYPE;
    public static final String COLLECTION = Blog.POSTS_COLLECTION;
    static Logger log = LoggerFactory.getLogger(PostExplorerPlugin.class);

    public static PostExplorerPlugin create() throws Exception {
        final IExplorerPlugin plugin = ExplorerPluginFactory.createMongoPlugin((params)->{
            return new PostExplorerPlugin(params.getCommunication(), params.getDb());
        });
        return (PostExplorerPlugin) plugin;
    }

    public PostExplorerPlugin(final IExplorerPluginCommunication communication, final MongoClient mongoClient) {
        super(communication, new PostResourceCrud(mongoClient));
    }

    @Override
    protected String getApplication() { return APPLICATION; }

    @Override
    protected String getResourceType() { return TYPE; }

    @Override
    protected Future<ExplorerMessage> toMessage(final ExplorerMessage message, final JsonObject source) {
        final String id = source.getString("_id");
        message.withSubResourceHtml(id, source.getString("content",""));
        return Future.succeededFuture(message);
    }

    static class PostResourceCrud extends ExplorerResourceCrudMongo {

        public PostResourceCrud(final MongoClient mongoClient) {
            super(mongoClient);
        }

        @Override
        protected String getCollectionName() { return COLLECTION; }

        @Override
        protected Object toMongoDate(LocalDateTime date) {
            return MongoDb.toMongoDate(date);
        }
    }

}
