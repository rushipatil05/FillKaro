package com.autoform.api.repositories;

import com.autoform.api.models.History;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoryRepository extends MongoRepository<History, String> {
    Page<History> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    long countByStatus(String status);
    
    @Aggregation(pipeline = {
        "{ $group: { _id: null, totalFilled: { $sum: '$filledCount' }, totalFields: { $sum: '$fieldCount' } } }"
    })
    AggregationResult getAggregateStats();
    
    interface AggregationResult {
        Long getTotalFilled();
        Long getTotalFields();
    }
}
