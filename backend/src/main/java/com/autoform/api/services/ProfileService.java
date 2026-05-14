package com.autoform.api.services;

import com.autoform.api.models.Profile;
import com.autoform.api.repositories.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final ProfileRepository repository;
    
    public List<Profile> getAllProfiles() {
        return repository.findByOrderByUpdatedAtDesc();
    }
    
    public Optional<Profile> getProfileById(String id) {
        return repository.findById(id);
    }
    
    public Profile createProfile(Profile profile) {
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());
        return repository.save(profile);
    }
    
    public Optional<Profile> updateProfile(String id, Profile profile) {
        return repository.findById(id).map(existing -> {
            existing.setName(profile.getName());
            existing.setDescription(profile.getDescription());
            existing.setFieldMap(profile.getFieldMap());
            existing.setTags(profile.getTags());
            existing.setUpdatedAt(LocalDateTime.now());
            return repository.save(existing);
        });
    }
    
    public boolean deleteProfile(String id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}
