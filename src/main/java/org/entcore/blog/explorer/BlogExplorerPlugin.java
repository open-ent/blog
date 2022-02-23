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

public class BlogExplorerPlugin extends ExplorerPluginResourceCrud {
    public static final String APPLICATION = Blog.APPLICATION;
    public static final String TYPE = Blog.BLOG_TYPE;
    public static final String COLLECTION = Blog.BLOGS_COLLECTION;
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
        //TODO should not push if creator id not found (redis will keep it)
        //TODO push metrics from all plugins (merge it)
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
        public UserInfos getCreatorForModel(JsonObject json) {
            final JsonObject author = json.getJsonObject("author");
            final UserInfos user = new UserInfos();
            user.setUserId( author.getString("userId"));
            user.setUsername(author.getString("username"));
            user.setLogin(author.getString("login"));
            return user;
        }

        @Override
        protected void setCreatorForModel(UserInfos user, JsonObject json) {
            final JsonObject author = new JsonObject();
            author.put("userId", user.getUserId());
            author.put("username", user.getUsername());
            author.put("login", user.getLogin());
            json.put("author", author);
        }

        @Override
        protected Object toMongoDate(LocalDateTime date) {
            return MongoDb.toMongoDate(date);
        }
    }

}
