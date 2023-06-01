package org.entcore.blog.controllers;

import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.vertx.java.core.http.RouteMatcher;

import java.util.Map;

public class FoldersControllerLegacy extends MongoDbControllerHelper implements FoldersController {

	public FoldersControllerLegacy(String collectionName) {
		super(collectionName);
	}
	@Override
	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
					 Map<String, SecuredAction> securedActions) {
		super.init(vertx, config, rm, securedActions);
	}
	@Override
	public void list(HttpServerRequest request) {
		super.list(request);
	}

	@Override
	public void add(HttpServerRequest request) {
		create(request);
	}

	@Override
	public void update(HttpServerRequest request) {
		super.update(request);
	}

	@Override
	public void delete(HttpServerRequest request) {
		super.delete(request);
	}
}