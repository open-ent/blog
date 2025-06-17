package org.entcore.blog.listeners;

import io.vertx.core.json.JsonObject;
import org.entcore.broker.api.dto.resources.ResourceInfoDTO;
import org.entcore.broker.proxy.ResourceBrokerListener;
import org.entcore.common.resources.MongoResourceBrokerListenerImpl;

import java.util.Date;

/**
 * Implementation of ResourceBrokerListener for the Blog module.
 * Retrieves resource information from the blog collection.
 * Implements ResourceBrokerListener to detect Broker annotations.
 */
public class ResourceBrokerListenerImpl extends MongoResourceBrokerListenerImpl implements ResourceBrokerListener {

    /**
     * Name of the MongoDB collection containing blog data
     */
    private static final String BLOGS_COLLECTION = "blogs";

    /**
     * Create a new MongoDB implementation of ResourceBrokerListener for blogs.
     */
    public ResourceBrokerListenerImpl() {
        super(BLOGS_COLLECTION);
    }
    
    /**
     * Convert MongoDB blog document to ResourceInfoDTO.
     * Overrides parent method to match the specific document structure in blogs.
     *
     * @param resource The MongoDB document from blogs collection
     * @return ResourceInfoDTO with extracted information
     */
    @Override
    protected ResourceInfoDTO convertToResourceInfoDTO(JsonObject resource) {
        if (resource == null) {
            return null;
        }
        
        try {
            // Extract basic information
            final String id = resource.getString("_id");
            final String title = resource.getString("title", "");
            final String description = resource.getString("description", "");
            final String thumbnail = resource.getString("thumbnail", "");
            
            // Extract author information from blog-specific structure
            final JsonObject author = resource.getJsonObject("author", new JsonObject());
            final String authorId = author.getString("userId", "");
            final String authorName = author.getString("username", "");
            
            // Handle ISODate format for blog documents
            Date creationDate = this.parseDate(resource.getValue("created", System.currentTimeMillis()));
            Date modificationDate = this.parseDate(resource.getValue("modified", System.currentTimeMillis()));
            
            return new ResourceInfoDTO(
                id,
                title,
                description,
                thumbnail,
                authorName,
                authorId,
                creationDate,
                modificationDate
            );
        } catch (Exception e) {
            log.error("Error converting Blog document to ResourceInfoDTO", e);
            return null;
        }
    }
}
