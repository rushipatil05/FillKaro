package com.autoform.api.repositories;

import com.autoform.api.models.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfileRepository extends MongoRepository<Profile, String> {
    List<Profile> findByOrderByUpdatedAtDesc();
    List<Profile> findByNameContainingIgnoreCase(String name);
}
