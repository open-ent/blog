package org.entcore.blog.controllers;

import fr.wseduc.rs.*;
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.http.BaseController;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import org.entcore.blog.security.FolderOwner;
import org.entcore.common.http.filter.ResourceFilter;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.vertx.java.core.http.RouteMatcher;

import java.util.Map;

public class FoldersControllerProxy extends BaseController implements FoldersController {

	private final FoldersController controller;

	public FoldersControllerProxy(final FoldersController controller) {
		this.controller = controller;
	}

	@Override
	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
					 Map<String, fr.wseduc.webutils.security.SecuredAction> securedActions) {
		super.init(vertx, config, rm, securedActions);
		this.controller.init(vertx, config, rm, securedActions);
	}

	@Override
	@Get("folder/list/:filter")
	@ApiDoc("List all user folders.")
	@SecuredAction("blog.listFolders")
	public void list(HttpServerRequest request) {
		this.controller.list(request);
	}

	@Override
	@Post("folder")
	@ApiDoc("Add folder.")
	@SecuredAction("blog.createFolder")
	public void add(HttpServerRequest request) {
		this.controller.add(request);
	}

	@Override
	@Put("folder/:id")
	@ApiDoc("Update folder by id.")
	@ResourceFilter(FolderOwner.class)
	public void update(HttpServerRequest request) {
		this.controller.update(request);
	}

	@Override
	@Delete("folder/:id")
	@ApiDoc("Delete folder by id.")
	@ResourceFilter(FolderOwner.class)
	public void delete(HttpServerRequest request) {
		this.controller.delete(request);
	}
}