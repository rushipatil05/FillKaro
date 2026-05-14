package com.autoform.api.controllers;

import com.autoform.api.models.Template;
import com.autoform.api.services.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {
    private final TemplateService service;
    
    @GetMapping
    public ResponseEntity<List<Template>> getAllTemplates() {
        return ResponseEntity.ok(service.getAllTemplates());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Template> getTemplateById(@PathVariable String id) {
        return service.getTemplateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Template> createTemplate(@RequestBody Template template) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTemplate(template));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Template> updateTemplate(@PathVariable String id, @RequestBody Template template) {
        return service.updateTemplate(id, template)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable String id) {
        if (service.deleteTemplate(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
