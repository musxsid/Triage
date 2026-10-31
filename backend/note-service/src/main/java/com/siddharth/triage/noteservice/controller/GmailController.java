package com.siddharth.triage.noteservice.controller;

import com.siddharth.triage.noteservice.entity.User;
import com.siddharth.triage.noteservice.service.GmailService;
import com.siddharth.triage.noteservice.service.UserSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gmail")
public class GmailController {

    private static final Logger log = LoggerFactory.getLogger(GmailController.class);

    private final GmailService gmailService;
    private final UserSyncService userSyncService;

    public GmailController(GmailService gmailService, UserSyncService userSyncService) {
        this.gmailService = gmailService;
        this.userSyncService = userSyncService;
    }

    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(
            @RequestParam(required = false, defaultValue = "inbox") String folder,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "25") int maxResults,
            Authentication authentication) {

        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            Map<String, Object> result = gmailService.listMessages(user, folder, q, maxResults);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to list Gmail messages: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/messages/{id}")
    public ResponseEntity<?> getMessageById(@PathVariable String id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            Map<String, Object> message = gmailService.getMessageDetails(user, id);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Failed to get Gmail message {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/messages/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> sendReq, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        String to = sendReq.get("to");
        String subject = sendReq.get("subject");
        String body = sendReq.get("body");

        if (to == null || to.trim().isEmpty() || subject == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Recipient ('to') and 'subject' are required"));
        }

        try {
            Map<String, Object> res = gmailService.sendMessage(user, to, subject, body != null ? body : "");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            log.error("Failed to send message: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/messages/{id}/star")
    public ResponseEntity<?> toggleStar(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Boolean> body,
            Authentication authentication) {

        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        boolean starred = (body != null && body.containsKey("starred")) ? body.get("starred") : true;

        try {
            gmailService.toggleStar(user, id, starred);
            return ResponseEntity.ok(Map.of("status", "success", "starred", starred));
        } catch (Exception e) {
            log.error("Failed to toggle star on message {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/messages/{id}/trash")
    public ResponseEntity<?> trashMessage(@PathVariable String id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            gmailService.trashMessage(user, id);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Moved to Trash"));
        } catch (Exception e) {
            log.error("Failed to trash message {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/messages/{id}/archive")
    public ResponseEntity<?> archiveMessage(@PathVariable String id, Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            gmailService.archiveMessage(user, id);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Archived message"));
        } catch (Exception e) {
            log.error("Failed to archive message {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/messages/{messageId}/attachments/{attachmentId}")
    public ResponseEntity<?> downloadAttachment(
            @PathVariable String messageId,
            @PathVariable String attachmentId,
            Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            return gmailService.downloadAttachment(user, messageId, attachmentId);
        } catch (Exception e) {
            log.error("Failed to download attachment {} for message {}: {}", attachmentId, messageId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
