package org.entcore.blog.controllers;

import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import org.vertx.java.core.http.RouteMatcher;

import java.util.Map;

public interface FoldersController {
	void list(HttpServerRequest request);
	void add(HttpServerRequest request);
	void update(HttpServerRequest request);
	void delete(HttpServerRequest request);
	public void init(Vertx vertx, JsonObject config, RouteMatcher rm,
					 Map<String, SecuredAction> securedActions);
}