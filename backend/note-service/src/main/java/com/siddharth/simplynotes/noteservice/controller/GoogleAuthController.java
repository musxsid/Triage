package com.siddharth.simplynotes.noteservice.controller;

import com.siddharth.simplynotes.noteservice.entity.User;
import com.siddharth.simplynotes.noteservice.service.GmailService;
import com.siddharth.simplynotes.noteservice.service.UserSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/google")
public class GoogleAuthController {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthController.class);

    private final GmailService gmailService;
    private final UserSyncService userSyncService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public GoogleAuthController(GmailService gmailService, UserSyncService userSyncService) {
        this.gmailService = gmailService;
        this.userSyncService = userSyncService;
    }

    @GetMapping("/gmail")
    public ResponseEntity<?> getGoogleAuthUrl(Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            String url = gmailService.generateAuthUrl(user.getUsername());
            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            log.error("Failed to generate Google auth URL: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/callback")
    public ResponseEntity<?> handleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        if (error != null) {
            log.warn("Google OAuth callback returned error: {}", error);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + "/email?error=" + error))
                    .build();
        }

        if (code == null || state == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing code or state parameter"));
        }

        try {
            gmailService.handleOAuthCallback(code, state);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + "/email?connected=true"))
                    .build();
        } catch (Exception e) {
            log.error("Error exchanging OAuth callback token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + "/email?error=" + e.getMessage()))
                    .build();
        }
    }

    @GetMapping("/gmail/status")
    public ResponseEntity<?> getGmailStatus(Authentication authentication) {
        User user = userSyncService.getOrCreateUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Map<String, Object> status = gmailService.getStatus(user);
        return ResponseEntity.ok(status);
    }
}
