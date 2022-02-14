package org.entcore.blog.explorer;

import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;
import org.entcore.common.explorer.*;
import org.entcore.common.user.UserInfos;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class BlogExplorerPlugin extends ExplorerPluginResourceCrud {
    public static final String APPLICATION = "blog";
    public static final String TYPE = "blog";
    public static final String COLLECTION = "blogs";
    static Logger log = LoggerFactory.getLogger(BlogExplorerPlugin.class);

    public static BlogExplorerPlugin create() throws Exception {
        final IExplorerPlugin plugin = ExplorerPluginFactory.createMongoPlugin((params)->{
            return new BlogExplorerPlugin(params.getCommunication(), params.getDb());
        });
        return (BlogExplorerPlugin) plugin;
    }

    public BlogExplorerPlugin(final IExplorerPluginCommunication communication, final MongoClient mongoClient) {
        super(communication, new BlogResourceCrud(mongoClient));
    }

    @Override
    protected String getApplication() { return APPLICATION; }

    @Override
    protected String getResourceType() { return TYPE; }

    @Override
    protected Future<ExplorerMessage> toMessage(final ExplorerMessage message, final JsonObject source) {
        message.withName(source.getString("title", ""));
        message.withContent(source.getString("description", ""), ExplorerMessage.ExplorerContentType.Html);
        message.withPublic("PUBLIC".equals(source.getString("visibility")));
        message.withTrashed(source.getBoolean("trashed", false));
        return Future.succeededFuture(message);
    }

    static class BlogResourceCrud extends ExplorerResourceCrudMongo {

        public BlogResourceCrud(final MongoClient mongoClient) {
            super(mongoClient);
        }

        @Override
        protected String getCollectionName() { return COLLECTION; }

        @Override
        protected String getCreatedAtColumn() {
            return "created";
        }

        @Override
        protected String getCreatorIdColumn() {
            return "userId";
        }

        @Override
        protected String getCreatorNameColumn() {
            return "username";
        }

        @Override
        protected String getIdColumn() {
            return "_id";
        }

        @Override
        protected Object toMongoDate(LocalDateTime date) {
            return (new JsonObject()).put("$date", date.toInstant(ZoneOffset.UTC).toEpochMilli());
        }
    }

}
