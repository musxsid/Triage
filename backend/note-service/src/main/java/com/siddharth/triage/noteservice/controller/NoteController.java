package com.siddharth.triage.noteservice.controller;

import com.siddharth.triage.noteservice.entity.Folder;
import com.siddharth.triage.noteservice.entity.Note;
import com.siddharth.triage.noteservice.entity.User;
import com.siddharth.triage.noteservice.entity.Workspace;
import com.siddharth.triage.noteservice.repository.FolderRepository;
import com.siddharth.triage.noteservice.repository.NoteRepository;
import com.siddharth.triage.noteservice.repository.WorkspaceRepository;
import com.siddharth.triage.noteservice.service.UserSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;
    private final FolderRepository folderRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserSyncService userSyncService;

    public NoteController(NoteRepository noteRepository,
                          FolderRepository folderRepository,
                          WorkspaceRepository workspaceRepository,
                          UserSyncService userSyncService) {
        this.noteRepository = noteRepository;
        this.folderRepository = folderRepository;
        this.workspaceRepository = workspaceRepository;
        this.userSyncService = userSyncService;
    }

    public static class FolderDTO {
        public Long id;
        public String name;
        public FolderDTO(Long id, String name) { this.id = id; this.name = name; }
    }

    public static class NoteDTO {
        public Long id;
        public String title;
        public String content;
        public Boolean isFavorite;
        public Boolean isPublic;
        public String shareToken;
        public FolderDTO folder;

        public NoteDTO(Note note) {
            this.id = note.getId();
            this.title = note.getTitle();
            this.content = note.getContent();
            this.isFavorite = note.getIsFavorite();
            this.isPublic = (note.getIsPublic() != null) ? note.getIsPublic() : false;
            this.shareToken = note.getShareToken();
            if (note.getFolder() != null) {
                this.folder = new FolderDTO(note.getFolder().getId(), note.getFolder().getName());
            }
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNoteById(@PathVariable Long id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Note note = noteRepository.findById(id).orElse(null);
        if (note == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note not found");
        if (!note.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        return ResponseEntity.ok(new NoteDTO(note));
    }

    @GetMapping
    public ResponseEntity<?> getNotes(@RequestParam(required = false) Long workspaceId, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        List<Note> notes;
        if (workspaceId != null) {
            Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
            if (workspace == null || !workspace.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid workspace access");
            }
            notes = noteRepository.findByWorkspace(workspace);
        } else {
            List<Workspace> userWorkspaces = workspaceRepository.findByUser(user);
            if (!userWorkspaces.isEmpty()) {
                notes = noteRepository.findByWorkspace(userWorkspaces.get(0));
            } else {
                notes = noteRepository.findByUser(user);
            }
        }

        return ResponseEntity.ok(notes.stream().map(NoteDTO::new).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> addNote(@RequestParam(required = false) Long workspaceId, @RequestBody Note note, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        note.setUser(user);

        if (note.getFolder() != null && note.getFolder().getId() != null) {
            Folder folder = folderRepository.findById(note.getFolder().getId()).orElse(null);
            note.setFolder(folder);
        }

        Workspace targetWorkspace = null;
        if (workspaceId != null) {
            targetWorkspace = workspaceRepository.findById(workspaceId).orElse(null);
        } else {
            List<Workspace> userWorkspaces = workspaceRepository.findByUser(user);
            if (!userWorkspaces.isEmpty()) targetWorkspace = userWorkspaces.get(0);
        }

        if (targetWorkspace != null && targetWorkspace.getUser().getId().equals(user.getId())) {
            note.setWorkspace(targetWorkspace);
        }

        Note saved = noteRepository.save(note);
        return ResponseEntity.ok(new NoteDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable Long id, @RequestBody Note updatedNote, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Note note = noteRepository.findById(id).orElse(null);
        if (note == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note not found");
        if (!note.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        note.setTitle(updatedNote.getTitle());
        note.setContent(updatedNote.getContent());

        if (updatedNote.getFolder() != null && updatedNote.getFolder().getId() != null) {
            Folder folder = folderRepository.findById(updatedNote.getFolder().getId()).orElse(null);
            note.setFolder(folder);
        } else {
            note.setFolder(null);
        }

        Note saved = noteRepository.save(note);
        return ResponseEntity.ok(new NoteDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Note note = noteRepository.findById(id).orElse(null);
        if (note == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note not found");
        if (!note.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        noteRepository.delete(note);
        return ResponseEntity.ok("Deleted");
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable Long id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Note note = noteRepository.findById(id).orElse(null);
        if (note == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note not found");
        if (!note.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        note.setIsFavorite(note.getIsFavorite() == null ? true : !note.getIsFavorite());
        return ResponseEntity.ok(new NoteDTO(noteRepository.save(note)));
    }

    @PutMapping("/{id}/share")
    public ResponseEntity<?> toggleShare(@PathVariable Long id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");

        Note note = noteRepository.findById(id).orElse(null);
        if (note == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note not found");
        if (!note.getUser().getId().equals(user.getId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");

        boolean newStatus = (note.getIsPublic() == null) ? true : !note.getIsPublic();
        note.setIsPublic(newStatus);

        if (newStatus && note.getShareToken() == null) {
            note.setShareToken(UUID.randomUUID().toString());
        }

        return ResponseEntity.ok(new NoteDTO(noteRepository.save(note)));
    }

    @GetMapping("/public/{shareToken}")
    public ResponseEntity<?> getPublicNote(@PathVariable String shareToken) {
        Note note = noteRepository.findByShareToken(shareToken).orElse(null);
        if (note == null || !Boolean.TRUE.equals(note.getIsPublic())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Public note not available");
        }
        return ResponseEntity.ok(new NoteDTO(note));
    }
}
