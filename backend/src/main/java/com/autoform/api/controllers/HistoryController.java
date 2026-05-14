package com.autoform.api.controllers;

import com.autoform.api.models.History;
import com.autoform.api.services.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {
    private final HistoryService service;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Page<History> pageResult = service.getHistoryPaginated(page, limit);
        
        Map<String, Object> response = new HashMap<>();
        response.put("docs", pageResult.getContent());
        response.put("total", pageResult.getTotalElements());
        response.put("page", page);
        response.put("pages", pageResult.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<HistoryService.HistoryStats> getStats() {
        return ResponseEntity.ok(service.getStats());
    }
    
    @PostMapping
    public ResponseEntity<History> createHistory(@RequestBody History history) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createHistory(history));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable String id) {
        if (service.deleteHistory(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
