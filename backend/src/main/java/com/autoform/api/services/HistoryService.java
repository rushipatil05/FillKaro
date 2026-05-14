package com.autoform.api.services;

import com.autoform.api.models.History;
import com.autoform.api.repositories.HistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HistoryService {
    private final HistoryRepository repository;
    
    public Page<History> getHistoryPaginated(int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        return repository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    public Optional<History> getHistoryById(String id) {
        return repository.findById(id);
    }
    
    public History createHistory(History history) {
        history.setCreatedAt(LocalDateTime.now());
        history.setUpdatedAt(LocalDateTime.now());
        return repository.save(history);
    }
    
    public boolean deleteHistory(String id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public HistoryStats getStats() {
        long total = repository.count();
        long complete = repository.countByStatus("complete");
        long partial = repository.countByStatus("partial");
        long failed = total - complete - partial;
        
        HistoryRepository.AggregationResult agg = repository.getAggregateStats();
        long totalFilled = agg != null && agg.getTotalFilled() != null ? agg.getTotalFilled() : 0;
        long totalFields = agg != null && agg.getTotalFields() != null ? agg.getTotalFields() : 0;
        
        return new HistoryStats(total, complete, partial, failed, totalFilled, totalFields);
    }
    
    public record HistoryStats(long total, long complete, long partial, long failed, long totalFilled, long totalFields) {}
}
