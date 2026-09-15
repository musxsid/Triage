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

    public User getOrCreateUserByUsername(String username) {
        return getOrCreateUserWithProfile(username, null, null, null, null);
    }

    public User getOrCreateUserWithProfile(String username, String email, String firstName, String lastName, String picture) {
        if (username == null || username.trim().isEmpty()) {
            username = "user";
        }
        final String targetUsername = username;
        User user = userRepository.findByUsername(targetUsername).orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername(targetUsername);
            return newUser;
        });

        if (email != null && !email.trim().isEmpty()) user.setEmail(email);
        if (firstName != null && !firstName.trim().isEmpty()) user.setFirstName(firstName);
        if (lastName != null && !lastName.trim().isEmpty()) user.setLastName(lastName);
        if (picture != null && !picture.trim().isEmpty()) user.setProfilePicture(picture);

        User saved = userRepository.save(user);

        List<Workspace> workspaces = workspaceRepository.findByUser(saved);
        if (workspaces.isEmpty()) {
            Workspace defaultWs = new Workspace();
            defaultWs.setName("Personal");
            defaultWs.setIcon("💼");
            defaultWs.setUser(saved);
            workspaceRepository.save(defaultWs);
        }

        return saved;
    }
}
