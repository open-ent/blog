package org.entcore.blog.explorer;

import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.explorer.IExplorerFolderTree;
import org.entcore.common.explorer.impl.ExplorerFolderTreeMongo;

import java.time.LocalDateTime;

public class BlogFoldersExplorerPlugin extends ExplorerFolderTreeMongo {
    public static final String TYPE = IExplorerFolderTree.FOLDER_TYPE;
    public static final String COLLECTION = "blogsFolders";
    static Logger log = LoggerFactory.getLogger(BlogFoldersExplorerPlugin.class);

    public BlogFoldersExplorerPlugin(final BlogExplorerPlugin plugin) {
        super(plugin, plugin.getMongoClient());
    }

    @Override
    protected String getCollectionName() { return COLLECTION; }

    @Override
    protected String getCreatedAtColumn() {
        return "created";
    }

    @Override
    protected Object toMongoDate(LocalDateTime date) {
        return MongoDb.toMongoDate(date);
    }

}
