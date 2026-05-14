package com.autoform.api.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "profiles")
public class Profile {
    @Id
    private String id;
    
    private String name;
    private String description;
    private Map<String, String> fieldMap = new HashMap<>();
    private List<String> tags;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
