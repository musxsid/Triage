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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

    @GetMapping("/login")
    public ResponseEntity<Void> googleLogin() {
        try {
            URI uri = gmailService.generateLoginUri();
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(uri)
                    .build();
        } catch (Exception e) {
            log.error("Failed to generate Google login URL: {}", e.getMessage(), e);
            String err = e.getMessage() != null ? e.getMessage() : "Failed to initiate Google login";
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + "/login?error=" + URLEncoder.encode(err, StandardCharsets.UTF_8)))
                    .build();
        }
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
            String target = (state != null && state.startsWith("login")) ? "/login?error=" : "/email?error=";
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + target + URLEncoder.encode(error, StandardCharsets.UTF_8)))
                    .build();
        }

        if (code == null || state == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing code or state parameter"));
        }

        if ("login".equals(state) || state.startsWith("login")) {
            try {
                Map<String, String> authResult = gmailService.handleOAuthLoginCallback(code);
                StringBuilder redirect = new StringBuilder(frontendUrl).append("/workspaces?");
                redirect.append("token=").append(URLEncoder.encode(authResult.get("token"), StandardCharsets.UTF_8));
                redirect.append("&username=").append(URLEncoder.encode(authResult.get("username"), StandardCharsets.UTF_8));
                if (authResult.get("name") != null) {
                    redirect.append("&name=").append(URLEncoder.encode(authResult.get("name"), StandardCharsets.UTF_8));
                }
                if (authResult.get("email") != null) {
                    redirect.append("&email=").append(URLEncoder.encode(authResult.get("email"), StandardCharsets.UTF_8));
                }
                if (authResult.get("picture") != null) {
                    redirect.append("&picture=").append(URLEncoder.encode(authResult.get("picture"), StandardCharsets.UTF_8));
                }
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(redirect.toString()))
                        .build();
            } catch (Exception e) {
                log.error("Error in Google login callback: {}", e.getMessage(), e);
                String err = e.getMessage() != null ? e.getMessage() : "Login failed";
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(frontendUrl + "/login?error=" + URLEncoder.encode(err, StandardCharsets.UTF_8)))
                        .build();
            }
        }

        try {
            Map<String, String> syncDetails = gmailService.handleOAuthCallback(code, state);
            StringBuilder redirect = new StringBuilder(frontendUrl).append("/email?connected=true");
            if (syncDetails != null) {
                if (syncDetails.get("picture") != null) {
                    redirect.append("&picture=").append(URLEncoder.encode(syncDetails.get("picture"), StandardCharsets.UTF_8));
                }
                if (syncDetails.get("name") != null) {
                    redirect.append("&name=").append(URLEncoder.encode(syncDetails.get("name"), StandardCharsets.UTF_8));
                }
                if (syncDetails.get("email") != null) {
                    redirect.append("&email=").append(URLEncoder.encode(syncDetails.get("email"), StandardCharsets.UTF_8));
                }
            }
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirect.toString()))
                    .build();
        } catch (Exception e) {
            log.error("Error exchanging OAuth callback token: {}", e.getMessage(), e);
            String err = e.getMessage() != null ? e.getMessage() : "Failed to connect Gmail";
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + "/email?error=" + URLEncoder.encode(err, StandardCharsets.UTF_8)))
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
