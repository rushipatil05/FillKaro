package com.autoform.api.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "templates")
public class Template {
    @Id
    private String id;
    
    private String name;
    private String domain;
    private String url;
    private List<Field> fields;
    
    @DBRef
    private Profile mappedProfile;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Field {
        private String label;
        private String name;
        private String id;
        private String type;
        private String placeholder;
    }
}
