package org.entcore.blog.controllers;

import fr.wseduc.webutils.http.Renders;
import fr.wseduc.webutils.request.RequestUtils;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.apache.commons.lang3.math.NumberUtils;
import org.entcore.blog.Blog;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.common.explorer.to.FolderDeleteRequest;
import org.entcore.common.explorer.to.FolderListRequest;
import org.entcore.common.explorer.to.FolderResponse;
import org.entcore.common.explorer.to.FolderUpsertRequest;
import org.entcore.common.user.UserUtils;

import java.util.Arrays;

public class FoldersControllerExplorer implements FoldersController {
	private final Vertx vertx;
	private final BlogExplorerPlugin plugin;
	public FoldersControllerExplorer(final Vertx vertx, final BlogExplorerPlugin plugin) {
		this.vertx = vertx;
		this.plugin = plugin;
	}

	private JsonObject adapt(final FolderResponse response){
		final JsonObject owner = new JsonObject().put("userId",response.getOwnerUserId()).put("displayName", response.getOwnerUserName());
		final JsonObject folder = new JsonObject();
		folder.put("created", new JsonObject().put("$date", response.getCreated()));
		folder.put("modified", new JsonObject().put("$date", response.getModified()));
		folder.put("name", response.getName());
		folder.put("owner", owner);
		folder.put("ressourceIds",new JsonArray(response.getEntResourceIds()));
		folder.put("id", response.getId());
		folder.put("_id", response.getId().toString());
		folder.put("trashed", response.getTrashed());
		if(response.getParentId() != null){
			folder.put("parentId", response.getParentId().toString());
		}else{
			folder.put("parentId", "root");
		}
		return folder;
	}

	@Override
	public void list(HttpServerRequest request) {
		RequestUtils.bodyToJson(request,  data-> {
			UserUtils.getUserInfos(this.vertx.eventBus(), request, user -> {
				if (user != null) {
					plugin.listFolder(user, new FolderListRequest(user, Blog.APPLICATION)).onComplete(result -> {
						if(result.succeeded()){
							final JsonArray folders = new JsonArray();
							for(final FolderResponse response : result.result()){
								folders.add(this.adapt(response));
							}
							Renders.renderJson(request, folders);
						}else{
							Renders.renderError(request, new JsonObject().put("error", result.cause().getMessage()));
						}
					});
				} else {
					Renders.unauthorized(request);
				}
			});
		});
	}

	@Override
	public void add(HttpServerRequest request) {
		RequestUtils.bodyToJson(request,  data-> {
			UserUtils.getUserInfos(this.vertx.eventBus(), request, user -> {
				if (user != null) {
					final Object parentId = data.getValue("parentId");
					final String name = data.getString("name");
					final Long safeParentId = parentId != null ? NumberUtils.toLong(parentId.toString()) : null;
					plugin.upsertFolder(user, new FolderUpsertRequest(user, safeParentId, Blog.APPLICATION, name)).onComplete(result -> {
						if(result.succeeded()){
							Renders.renderJson(request, this.adapt(result.result()));
						}else{
							Renders.renderError(request, new JsonObject().put("error", result.cause().getMessage()));
						}
					});
				} else {
					Renders.unauthorized(request);
				}
			});
		});
	}

	@Override
	public void update(HttpServerRequest request) {
		RequestUtils.bodyToJson(request,  data-> {
			UserUtils.getUserInfos(this.vertx.eventBus(), request, user -> {
				if (user != null) {
					final Object parentId = data.getValue("parentId");
					final Long safeParentId = parentId != null ? NumberUtils.toLong(parentId.toString()) : null;
					final Boolean trashed = data.getBoolean("trashed");
					final String id = request.params().get("id");
					final Long safeId = NumberUtils.toLong(id);
					final String name = data.getString("name");
					plugin.upsertFolder(user, new FolderUpsertRequest(user, safeId, safeParentId, trashed, Blog.APPLICATION, name)).onComplete(result -> {
						if(result.succeeded()){
							Renders.renderJson(request, this.adapt(result.result()));
						}else{
							Renders.renderError(request, new JsonObject().put("error", result.cause().getMessage()));
						}
					});
				} else {
					Renders.unauthorized(request);
				}
			});
		});
	}

	@Override
	public void delete(HttpServerRequest request) {
		UserUtils.getUserInfos(this.vertx.eventBus(), request, user -> {
			if (user != null) {
				final String id = request.params().get("id");
				final Long safeId = NumberUtils.toLong(id);
				plugin.deleteFolder(user, new FolderDeleteRequest(user, Arrays.asList(safeId),Blog.APPLICATION)).onComplete(result -> {
					if(result.succeeded()){
						Renders.noContent(request);
					}else{
						Renders.renderError(request, new JsonObject().put("error", result.cause().getMessage()));
					}
				});
			} else {
				Renders.unauthorized(request);
			}
		});
	}
}