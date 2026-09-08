package com.siddharth.simplynotes.noteservice.service;

import com.siddharth.simplynotes.noteservice.entity.User;
import com.siddharth.simplynotes.noteservice.entity.Workspace;
import com.siddharth.simplynotes.noteservice.repository.UserRepository;
import com.siddharth.simplynotes.noteservice.repository.WorkspaceRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserSyncService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;

    public UserSyncService(UserRepository userRepository, WorkspaceRepository workspaceRepository) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
    }

    public User getOrCreateUser(Authentication authentication) {
        if (authentication == null) return null;

        String username = authentication.getName();
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String preferredUsername = jwt.getClaimAsString("preferred_username");
            if (preferredUsername != null && !preferredUsername.isEmpty()) {
                username = preferredUsername;
            }
        }

        final String targetUsername = username;
        return userRepository.findByUsername(targetUsername).orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername(targetUsername);
            User saved = userRepository.save(newUser);

            // Ensure default workspace exists
            List<Workspace> workspaces = workspaceRepository.findByUser(saved);
            if (workspaces.isEmpty()) {
                Workspace defaultWs = new Workspace();
                defaultWs.setName("Personal");
                defaultWs.setIcon("💼");
                defaultWs.setUser(saved);
                workspaceRepository.save(defaultWs);
            }

            return saved;
        });
    }
}
