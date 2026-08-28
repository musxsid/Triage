package com.siddharth.simplynotes.noteservice.controller;

import com.siddharth.simplynotes.noteservice.entity.Folder;
import com.siddharth.simplynotes.noteservice.entity.Note;
import com.siddharth.simplynotes.noteservice.entity.User;
import com.siddharth.simplynotes.noteservice.entity.Workspace;
import com.siddharth.simplynotes.noteservice.repository.FolderRepository;
import com.siddharth.simplynotes.noteservice.repository.NoteRepository;
import com.siddharth.simplynotes.noteservice.repository.WorkspaceRepository;
import com.siddharth.simplynotes.noteservice.service.UserSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderRepository folderRepository;
    private final WorkspaceRepository workspaceRepository;
    private final NoteRepository noteRepository;
    private final UserSyncService userSyncService;

    public FolderController(FolderRepository folderRepository,
                            WorkspaceRepository workspaceRepository,
                            NoteRepository noteRepository,
                            UserSyncService userSyncService) {
        this.folderRepository = folderRepository;
        this.workspaceRepository = workspaceRepository;
        this.noteRepository = noteRepository;
        this.userSyncService = userSyncService;
    }

    @GetMapping
    public ResponseEntity<?> getFolders(@RequestParam(required = false) Long workspaceId, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        List<Folder> folders;
        if (workspaceId != null) {
            Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
            if (workspace == null || !workspace.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid workspace");
            }
            folders = folderRepository.findByWorkspace(workspace);
        } else {
            List<Workspace> userWorkspaces = workspaceRepository.findByUser(user);
            if (!userWorkspaces.isEmpty()) {
                folders = folderRepository.findByWorkspace(userWorkspaces.get(0));
            } else {
                folders = folderRepository.findByUser(user);
            }
        }

        return ResponseEntity.ok(folders);
    }

    @PostMapping
    public ResponseEntity<?> createFolder(@RequestParam(required = false) Long workspaceId, @RequestBody Folder folder, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        folder.setUser(user);

        Workspace targetWorkspace = null;
        if (workspaceId != null) {
            targetWorkspace = workspaceRepository.findById(workspaceId).orElse(null);
        } else {
            List<Workspace> userWorkspaces = workspaceRepository.findByUser(user);
            if (!userWorkspaces.isEmpty()) targetWorkspace = userWorkspaces.get(0);
        }

        if (targetWorkspace != null && targetWorkspace.getUser().getId().equals(user.getId())) {
            folder.setWorkspace(targetWorkspace);
        }

        Folder saved = folderRepository.save(folder);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteFolder(@PathVariable Long id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Folder folder = folderRepository.findById(id).orElse(null);
        if (folder == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Folder not found");
        if (!folder.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        List<Note> notes = folder.getNotes();
        if (notes != null) {
            for (Note note : notes) {
                note.setFolder(null);
                noteRepository.save(note);
            }
        }

        folderRepository.delete(folder);
        return ResponseEntity.ok("Folder deleted");
    }
}
