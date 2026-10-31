package com.siddharth.triage.noteservice.controller;

import com.siddharth.triage.noteservice.entity.User;
import com.siddharth.triage.noteservice.entity.Workspace;
import com.siddharth.triage.noteservice.repository.WorkspaceRepository;
import com.siddharth.triage.noteservice.service.UserSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final UserSyncService userSyncService;

    public WorkspaceController(WorkspaceRepository workspaceRepository, UserSyncService userSyncService) {
        this.workspaceRepository = workspaceRepository;
        this.userSyncService = userSyncService;
    }

    public static class WorkspaceDTO {
        public Long id;
        public String name;
        public String icon;
        public String coverImage;

        public WorkspaceDTO(Workspace workspace) {
            this.id = workspace.getId();
            this.name = workspace.getName();
            this.icon = workspace.getIcon();
            this.coverImage = workspace.getCoverImage();
        }
    }

    @GetMapping
    public ResponseEntity<?> getWorkspaces(Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        List<Workspace> workspaces = workspaceRepository.findByUser(user);
        if (workspaces.isEmpty()) {
            Workspace defaultWs = new Workspace();
            defaultWs.setName("Personal");
            defaultWs.setIcon("💼");
            defaultWs.setUser(user);
            workspaceRepository.save(defaultWs);
            workspaces = workspaceRepository.findByUser(user);
        }
        List<WorkspaceDTO> response = workspaces.stream().map(WorkspaceDTO::new).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createWorkspace(@RequestBody Workspace request, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName(request.getName() != null ? request.getName() : "Untitled Workspace");
        newWorkspace.setIcon(request.getIcon() != null ? request.getIcon() : "layout");
        newWorkspace.setCoverImage(request.getCoverImage());
        newWorkspace.setUser(user);

        Workspace saved = workspaceRepository.save(newWorkspace);
        return ResponseEntity.ok(new WorkspaceDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkspace(@PathVariable Long id, @RequestBody Workspace request, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Workspace workspace = workspaceRepository.findById(id).orElse(null);
        if (workspace == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Workspace not found");
        if (!workspace.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        if (request.getName() != null) workspace.setName(request.getName());
        if (request.getIcon() != null) workspace.setIcon(request.getIcon());
        if (request.getCoverImage() != null) workspace.setCoverImage(request.getCoverImage());

        Workspace saved = workspaceRepository.save(workspace);
        return ResponseEntity.ok(new WorkspaceDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkspace(@PathVariable Long id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Workspace workspace = workspaceRepository.findById(id).orElse(null);
        if (workspace == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Workspace not found");
        if (!workspace.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        workspaceRepository.delete(workspace);
        return ResponseEntity.ok("Workspace deleted successfully");
    }
}
