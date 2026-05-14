package com.autoform.api.services;

import com.autoform.api.models.Template;
import com.autoform.api.repositories.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TemplateService {
    private final TemplateRepository repository;
    
    public List<Template> getAllTemplates() {
        return repository.findByOrderByUpdatedAtDesc();
    }
    
    public Optional<Template> getTemplateById(String id) {
        return repository.findById(id);
    }
    
    public Template createTemplate(Template template) {
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        return repository.save(template);
    }
    
    public Optional<Template> updateTemplate(String id, Template template) {
        return repository.findById(id).map(existing -> {
            existing.setName(template.getName());
            existing.setDomain(template.getDomain());
            existing.setUrl(template.getUrl());
            existing.setFields(template.getFields());
            existing.setMappedProfile(template.getMappedProfile());
            existing.setUpdatedAt(LocalDateTime.now());
            return repository.save(existing);
        });
    }
    
    public boolean deleteTemplate(String id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}
