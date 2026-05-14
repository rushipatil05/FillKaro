package com.autoform.api.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "history")
public class History {
    @Id
    private String id;
    
    private String domain;
    private String url;
    private String title;
    private Integer fieldCount;
    private Integer filledCount;
    
    @DBRef
    private Profile profileUsed;
    
    private String profileName;
    private String status; // complete, partial, failed
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
