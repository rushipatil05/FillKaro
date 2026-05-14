package com.autoform.api.repositories;

import com.autoform.api.models.Template;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateRepository extends MongoRepository<Template, String> {
    List<Template> findByOrderByUpdatedAtDesc();
    List<Template> findByDomainContainingIgnoreCase(String domain);
}
