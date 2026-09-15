package com.siddharth.simplynotes.noteservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.siddharth.simplynotes.noteservice.entity.OAuthCredential;
import com.siddharth.simplynotes.noteservice.entity.User;
import com.siddharth.simplynotes.noteservice.repository.OAuthCredentialRepository;
import com.siddharth.simplynotes.noteservice.repository.UserRepository;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailService.class);

    @Value("${google.oauth.client-id:}")
    private String clientId;

    @Value("${google.oauth.client-secret:}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri:http://localhost:8080/api/auth/google/callback}")
    private String redirectUri;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${keycloak.url:http://keycloak:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:simplynotes}")
    private String realm;

    @Value("${keycloak.client-id:simplynotes-app}")
    private String keycloakClientId;

    private static final String GOOGLE_AUTH_PASSWORD = "SimplyNotesGoogleAuth2026!";

    private final OAuthCredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final UserSyncService userSyncService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GmailService(OAuthCredentialRepository credentialRepository, UserRepository userRepository, UserSyncService userSyncService) {
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
        this.userSyncService = userSyncService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public URI generateLoginUri() {
        if (clientId == null || clientId.trim().isEmpty()) {
            throw new IllegalStateException("Google OAuth Client ID is not configured. Please set GOOGLE_CLIENT_ID in your .env file.");
        }

        String scopes = String.join(" ",
                "openid",
                "profile",
                "email"
        );

        return UriComponentsBuilder.fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", scopes)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", "login")
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();
    }

    public String generateLoginUrl() {
        return generateLoginUri().toString();
    }

    public String generateAuthUrl(String username) {
        if (clientId == null || clientId.trim().isEmpty()) {
            throw new IllegalStateException("Google OAuth Client ID is not configured. Please set GOOGLE_CLIENT_ID in your .env file.");
        }

        String scopes = String.join(" ",
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile"
        );

        return UriComponentsBuilder.fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", scopes)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", username)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUriString();
    }

    public Map<String, String> handleOAuthCallback(String code, String username) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity("https://oauth2.googleapis.com/token", request, Map.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Failed to exchange authorization code with Google");
        }

        Map tokenBody = response.getBody();
        String accessToken = (String) tokenBody.get("access_token");
        String refreshToken = (String) tokenBody.get("refresh_token");
        Integer expiresIn = (Integer) tokenBody.get("expires_in");
        String scope = (String) tokenBody.get("scope");

        // Fetch user info from Google UserInfo
        String googleEmail = null;
        String googlePicture = null;
        String googleName = null;
        try {
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            HttpEntity<?> userReq = new HttpEntity<>(userHeaders);
            ResponseEntity<Map> userResp = restTemplate.exchange("https://www.googleapis.com/oauth2/v2/userinfo", HttpMethod.GET, userReq, Map.class);
            if (userResp.getBody() != null) {
                googleEmail = (String) userResp.getBody().get("email");
                googlePicture = (String) userResp.getBody().get("picture");
                googleName = (String) userResp.getBody().get("name");
            }
        } catch (Exception e) {
            log.warn("Could not fetch userinfo from Google: {}", e.getMessage());
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (googleEmail != null && (user.getEmail() == null || user.getEmail().isEmpty())) {
            user.setEmail(googleEmail);
        }
        if (googlePicture != null) {
            user.setProfilePicture(googlePicture);
        }
        userRepository.save(user);

        OAuthCredential credential = credentialRepository.findByUserAndProvider(user, "google")
                .orElseGet(() -> {
                    OAuthCredential cred = new OAuthCredential();
                    cred.setUser(user);
                    cred.setProvider("google");
                    return cred;
                });

        credential.setAccessToken(accessToken);
        if (refreshToken != null && !refreshToken.isEmpty()) {
            credential.setRefreshToken(refreshToken);
        }
        credential.setTokenExpiry(Instant.now().plusSeconds(expiresIn != null ? expiresIn : 3600));
        credential.setScope(scope);
        if (googleEmail != null) {
            credential.setEmail(googleEmail);
        }

        credentialRepository.save(credential);

        Map<String, String> details = new HashMap<>();
        if (googleEmail != null) details.put("email", googleEmail);
        if (googlePicture != null) details.put("picture", googlePicture);
        if (googleName != null) details.put("name", googleName);
        return details;
    }

    public Map<String, String> handleOAuthLoginCallback(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity("https://oauth2.googleapis.com/token", request, Map.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Failed to exchange authorization code with Google");
        }

        Map tokenBody = response.getBody();
        String accessToken = (String) tokenBody.get("access_token");
        String refreshToken = (String) tokenBody.get("refresh_token");
        Integer expiresIn = (Integer) tokenBody.get("expires_in");
        String scope = (String) tokenBody.get("scope");

        // Fetch userinfo from Google
        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.setBearerAuth(accessToken);
        HttpEntity<?> userReq = new HttpEntity<>(userHeaders);
        ResponseEntity<Map> userResp = restTemplate.exchange("https://www.googleapis.com/oauth2/v2/userinfo", HttpMethod.GET, userReq, Map.class);
        if (userResp.getBody() == null) {
            throw new RuntimeException("Failed to fetch user profile from Google");
        }

        Map userInfo = userResp.getBody();
        String email = (String) userInfo.get("email");
        String givenName = (String) userInfo.get("given_name");
        String familyName = (String) userInfo.get("family_name");
        String name = (String) userInfo.get("name");

        String picture = (String) userInfo.get("picture");

        String firstName = (givenName != null && !givenName.trim().isEmpty()) ? givenName : ((name != null && !name.trim().isEmpty()) ? name : "User");
        String lastName = (familyName != null && !familyName.trim().isEmpty()) ? familyName : firstName;

        // Sync with Keycloak and obtain genuine Keycloak JWT token
        String keycloakJwt = syncAndAuthenticateWithKeycloak(email, firstName, lastName);
        String targetUsername = extractUsernameFromJwt(keycloakJwt);

        // Sync with PostgreSQL User including profile picture
        User dbUser = userSyncService.getOrCreateUserWithProfile(targetUsername, email, firstName, lastName, picture);

        // Save OAuth credentials for live Gmail access if Gmail scopes were granted
        if (scope != null && scope.contains("gmail")) {
            OAuthCredential credential = credentialRepository.findByUserAndProvider(dbUser, "google")
                    .orElseGet(() -> {
                        OAuthCredential cred = new OAuthCredential();
                        cred.setUser(dbUser);
                        cred.setProvider("google");
                        return cred;
                    });

            credential.setAccessToken(accessToken);
            if (refreshToken != null && !refreshToken.isEmpty()) {
                credential.setRefreshToken(refreshToken);
            }
            credential.setTokenExpiry(Instant.now().plusSeconds(expiresIn != null ? expiresIn : 3600));
            credential.setScope(scope);
            credential.setEmail(email);
            credentialRepository.save(credential);
        }

        Map<String, String> authResult = new HashMap<>();
        authResult.put("token", keycloakJwt);
        authResult.put("username", targetUsername);
        authResult.put("name", (name != null && !name.trim().isEmpty()) ? name : (firstName + " " + lastName).trim());
        authResult.put("email", email);
        if (picture != null && !picture.trim().isEmpty()) {
            authResult.put("picture", picture);
        }
        return authResult;
    }

    private String syncAndAuthenticateWithKeycloak(String email, String firstName, String lastName) {
        HttpHeaders formHeaders = new HttpHeaders();
        formHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // 1. Get Admin token
        MultiValueMap<String, String> adminCreds = new LinkedMultiValueMap<>();
        adminCreds.add("client_id", "admin-cli");
        adminCreds.add("username", "admin");
        adminCreds.add("password", "admin");
        adminCreds.add("grant_type", "password");

        HttpEntity<MultiValueMap<String, String>> adminReq = new HttpEntity<>(adminCreds, formHeaders);
        String adminTokenUrl = String.format("%s/realms/master/protocol/openid-connect/token", keycloakUrl);
        ResponseEntity<Map> adminRes = restTemplate.postForEntity(adminTokenUrl, adminReq, Map.class);
        if (adminRes.getBody() == null || !adminRes.getBody().containsKey("access_token")) {
            throw new RuntimeException("Failed to obtain Keycloak admin token");
        }
        String adminJwt = (String) adminRes.getBody().get("access_token");

        // 2. Search for user by email in Keycloak
        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(adminJwt);
        authHeaders.setContentType(MediaType.APPLICATION_JSON);

        String searchEmailUrl = String.format("%s/admin/realms/%s/users?email=%s", keycloakUrl, realm, email);
        ResponseEntity<List> userListRes = restTemplate.exchange(searchEmailUrl, HttpMethod.GET, new HttpEntity<>(authHeaders), List.class);

        String username;
        if (userListRes.getBody() != null && !userListRes.getBody().isEmpty()) {
            Map existingUser = (Map) userListRes.getBody().get(0);
            String userId = (String) existingUser.get("id");
            username = (String) existingUser.get("username");

            // Update user to ensure lastName and clear required actions
            Map<String, Object> updateBody = new HashMap<>();
            updateBody.put("firstName", firstName);
            updateBody.put("lastName", lastName);
            updateBody.put("email", email);
            updateBody.put("enabled", true);
            updateBody.put("emailVerified", true);
            updateBody.put("requiredActions", Collections.emptyList());

            String updateUserUrl = String.format("%s/admin/realms/%s/users/%s", keycloakUrl, realm, userId);
            restTemplate.exchange(updateUserUrl, HttpMethod.PUT, new HttpEntity<>(updateBody, authHeaders), Void.class);

            // Reset password to GOOGLE_AUTH_PASSWORD
            Map<String, Object> resetBody = Map.of("type", "password", "value", GOOGLE_AUTH_PASSWORD, "temporary", false);
            String resetUrl = String.format("%s/admin/realms/%s/users/%s/reset-password", keycloakUrl, realm, userId);
            restTemplate.exchange(resetUrl, HttpMethod.PUT, new HttpEntity<>(resetBody, authHeaders), Void.class);
        } else {
            // Create user
            username = email.split("@")[0].replaceAll("[^a-zA-Z0-9_-]", "");
            Map<String, Object> createBody = new HashMap<>();
            createBody.put("username", username);
            createBody.put("email", email);
            createBody.put("firstName", firstName);
            createBody.put("lastName", lastName);
            createBody.put("enabled", true);
            createBody.put("emailVerified", true);
            createBody.put("requiredActions", Collections.emptyList());
            createBody.put("credentials", List.of(Map.of("type", "password", "value", GOOGLE_AUTH_PASSWORD, "temporary", false)));

            String createUrl = String.format("%s/admin/realms/%s/users", keycloakUrl, realm);
            try {
                restTemplate.postForEntity(createUrl, new HttpEntity<>(createBody, authHeaders), Void.class);
            } catch (Exception ex) {
                // If username already taken with another email, append random suffix
                username = username + "_" + (int)(Math.random() * 9000 + 1000);
                createBody.put("username", username);
                restTemplate.postForEntity(createUrl, new HttpEntity<>(createBody, authHeaders), Void.class);
            }
        }

        // 3. Authenticate with Keycloak Direct Access Grant to obtain genuine user JWT
        MultiValueMap<String, String> userCreds = new LinkedMultiValueMap<>();
        userCreds.add("client_id", keycloakClientId);
        userCreds.add("username", username);
        userCreds.add("password", GOOGLE_AUTH_PASSWORD);
        userCreds.add("grant_type", "password");

        HttpEntity<MultiValueMap<String, String>> tokenReq = new HttpEntity<>(userCreds, formHeaders);
        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", keycloakUrl, realm);
        ResponseEntity<Map> tokenRes = restTemplate.postForEntity(tokenUrl, tokenReq, Map.class);
        if (tokenRes.getBody() == null || !tokenRes.getBody().containsKey("access_token")) {
            throw new RuntimeException("Failed to authenticate user against Keycloak");
        }

        return (String) tokenRes.getBody().get("access_token");
    }

    private String extractUsernameFromJwt(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
                Map claims = objectMapper.readValue(decoded, Map.class);
                return (String) claims.getOrDefault("preferred_username", claims.getOrDefault("sub", "user"));
            }
        } catch (Exception e) {
            log.warn("Failed to extract username from JWT: {}", e.getMessage());
        }
        return "user";
    }

    public Map<String, Object> getStatus(User user) {
        Optional<OAuthCredential> credOpt = credentialRepository.findByUserAndProvider(user, "google");
        Map<String, Object> status = new HashMap<>();
        if (credOpt.isPresent() && credOpt.get().getRefreshToken() != null) {
            status.put("connected", true);
            status.put("email", credOpt.get().getEmail() != null ? credOpt.get().getEmail() : user.getEmail());
        } else {
            status.put("connected", false);
            status.put("email", null);
        }
        return status;
    }

    public synchronized String getValidAccessToken(User user) {
        OAuthCredential credential = credentialRepository.findByUserAndProvider(user, "google")
                .orElseThrow(() -> new IllegalStateException("Google account not connected. Please connect Gmail first."));

        if (credential.getRefreshToken() == null || credential.getRefreshToken().isEmpty()) {
            throw new IllegalStateException("No refresh token available. Please reconnect your Google account.");
        }

        // Check if access token is still valid (buffer 60 seconds)
        if (credential.getAccessToken() != null && credential.getTokenExpiry() != null &&
                Instant.now().isBefore(credential.getTokenExpiry().minusSeconds(60))) {
            return credential.getAccessToken();
        }

        // Refresh token
        log.info("Refreshing expired Google OAuth access token for user: {}", user.getUsername());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("refresh_token", credential.getRefreshToken());
        params.add("grant_type", "refresh_token");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity("https://oauth2.googleapis.com/token", request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                String newAccessToken = (String) body.get("access_token");
                Integer expiresIn = (Integer) body.get("expires_in");

                credential.setAccessToken(newAccessToken);
                credential.setTokenExpiry(Instant.now().plusSeconds(expiresIn != null ? expiresIn : 3600));
                credentialRepository.save(credential);

                return newAccessToken;
            }
        } catch (HttpClientErrorException e) {
            log.error("Google token refresh failed: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Google authorization expired. Please reconnect your account.");
        }

        return credential.getAccessToken();
    }

    public Map<String, Object> listMessages(User user, String folder, String query, int maxResults) {
        String token = getValidAccessToken(user);

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl("https://gmail.googleapis.com/gmail/v1/users/me/messages");

        String q = (query != null && !query.trim().isEmpty()) ? query.trim() : "";

        if (folder != null) {
            String lowerFolder = folder.toLowerCase();
            switch (lowerFolder) {
                case "inbox" -> builder.queryParam("labelIds", "INBOX");
                case "starred" -> builder.queryParam("labelIds", "STARRED");
                case "sent" -> builder.queryParam("labelIds", "SENT");
                case "drafts" -> builder.queryParam("labelIds", "DRAFT");
                case "trash" -> {
                    q = q.isEmpty() ? "in:trash" : q + " in:trash";
                    builder.queryParam("includeSpamTrash", "true");
                }
                case "archive" -> {
                    q = q.isEmpty() ? "-in:inbox -in:trash -in:spam" : q + " -in:inbox -in:trash -in:spam";
                }
            }
        }

        if (!q.isEmpty()) {
            builder.queryParam("q", q);
        }

        builder.queryParam("maxResults", Math.min(maxResults > 0 ? maxResults : 20, 50));

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<JsonNode> response = restTemplate.exchange(builder.build().toUri(), HttpMethod.GET, entity, JsonNode.class);

        List<Map<String, Object>> parsedMessages = new ArrayList<>();
        JsonNode messagesNode = response.getBody() != null ? response.getBody().get("messages") : null;

        if (messagesNode != null && messagesNode.isArray()) {
            for (JsonNode m : messagesNode) {
                String messageId = m.get("id").asText();
                try {
                    Map<String, Object> emailSummary = getMessageSummary(token, messageId);
                    if (emailSummary != null) {
                        parsedMessages.add(emailSummary);
                    }
                } catch (Exception ex) {
                    log.warn("Failed to fetch summary for message {}: {}", messageId, ex.getMessage());
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("messages", parsedMessages);
        result.put("folder", folder);
        result.put("total", parsedMessages.size());
        return result;
    }

    private Map<String, Object> getMessageSummary(String token, String messageId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messageId + "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date";
        ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
        JsonNode node = response.getBody();
        if (node == null) return null;

        Map<String, Object> map = new HashMap<>();
        map.put("id", node.get("id").asText());
        map.put("threadId", node.has("threadId") ? node.get("threadId").asText() : "");
        map.put("preview", cleanEntityJunk(node.has("snippet") ? node.get("snippet").asText() : ""));

        Set<String> labels = new HashSet<>();
        if (node.has("labelIds")) {
            for (JsonNode l : node.get("labelIds")) {
                labels.add(l.asText());
            }
        }
        map.put("unread", labels.contains("UNREAD"));
        map.put("starred", labels.contains("STARRED"));

        String folder = "inbox";
        if (labels.contains("SENT")) folder = "sent";
        else if (labels.contains("DRAFT")) folder = "drafts";
        else if (labels.contains("TRASH")) folder = "trash";
        else if (!labels.contains("INBOX")) folder = "archive";
        map.put("folder", folder);

        String rawFrom = "";
        String subject = "(No Subject)";
        String dateStr = "";

        JsonNode headersNode = node.path("payload").path("headers");
        if (headersNode.isArray()) {
            for (JsonNode h : headersNode) {
                String name = h.path("name").asText();
                String value = h.path("value").asText();
                if ("From".equalsIgnoreCase(name)) rawFrom = value;
                else if ("Subject".equalsIgnoreCase(name)) subject = value;
                else if ("Date".equalsIgnoreCase(name)) dateStr = value;
            }
        }

        String senderName = rawFrom;
        String senderEmail = rawFrom;
        Pattern pattern = Pattern.compile("^(.*?)\\s*<([^>]+)>$");
        Matcher matcher = pattern.matcher(rawFrom);
        if (matcher.find()) {
            senderName = matcher.group(1).replace("\"", "").trim();
            senderEmail = matcher.group(2).trim();
            if (senderName.isEmpty()) senderName = senderEmail;
        }

        map.put("sender", senderName);
        map.put("email", senderEmail);
        map.put("subject", subject);
        map.put("avatar", getAvatarInitials(senderName));
        map.put("date", formatEmailDate(node.path("internalDate").asText(), dateStr));
        map.put("tag", determineTag(labels, subject));

        return map;
    }

    public Map<String, Object> getMessageDetails(User user, String messageId) {
        String token = getValidAccessToken(user);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messageId + "?format=full";
        ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
        JsonNode node = response.getBody();
        if (node == null) {
            throw new RuntimeException("Message not found: " + messageId);
        }

        Map<String, Object> map = new HashMap<>();
        map.put("id", node.get("id").asText());
        map.put("threadId", node.path("threadId").asText());
        map.put("preview", cleanEntityJunk(node.path("snippet").asText()));

        Set<String> labels = new HashSet<>();
        if (node.has("labelIds")) {
            for (JsonNode l : node.get("labelIds")) {
                labels.add(l.asText());
            }
        }
        map.put("unread", labels.contains("UNREAD"));
        map.put("starred", labels.contains("STARRED"));

        String rawFrom = "";
        String rawTo = "";
        String subject = "(No Subject)";
        String dateStr = "";

        JsonNode headersNode = node.path("payload").path("headers");
        if (headersNode.isArray()) {
            for (JsonNode h : headersNode) {
                String name = h.path("name").asText();
                String value = h.path("value").asText();
                if ("From".equalsIgnoreCase(name)) rawFrom = value;
                else if ("To".equalsIgnoreCase(name)) rawTo = value;
                else if ("Subject".equalsIgnoreCase(name)) subject = value;
                else if ("Date".equalsIgnoreCase(name)) dateStr = value;
            }
        }

        String senderName = rawFrom;
        String senderEmail = rawFrom;
        Pattern pattern = Pattern.compile("^(.*?)\\s*<([^>]+)>$");
        Matcher matcher = pattern.matcher(rawFrom);
        if (matcher.find()) {
            senderName = matcher.group(1).replace("\"", "").trim();
            senderEmail = matcher.group(2).trim();
            if (senderName.isEmpty()) senderName = senderEmail;
        }

        map.put("sender", senderName);
        map.put("email", senderEmail);
        map.put("to", rawTo);
        map.put("subject", subject);
        map.put("avatar", getAvatarInitials(senderName));
        map.put("date", formatEmailDate(node.path("internalDate").asText(), dateStr));
        map.put("tag", determineTag(labels, subject));

        // Recursive extraction of rich HTML, text, and attachments
        EmailContent emailContent = new EmailContent();
        parsePayloadRecursive(node.path("payload"), emailContent);

        String mainBody = emailContent.getHtmlBody();
        if (mainBody == null || mainBody.trim().isEmpty()) {
            mainBody = emailContent.getTextBody();
        }
        if (mainBody == null || mainBody.trim().isEmpty()) {
            mainBody = cleanEntityJunk(node.path("snippet").asText());
        }

        map.put("body", mainBody);
        map.put("htmlBody", emailContent.getHtmlBody());
        map.put("textBody", emailContent.getTextBody());
        map.put("attachments", emailContent.getAttachments());

        // Mark as read if unread
        if (labels.contains("UNREAD")) {
            try {
                Map<String, Object> modBody = Map.of("removeLabelIds", List.of("UNREAD"));
                HttpEntity<Map<String, Object>> modReq = new HttpEntity<>(modBody, headers);
                restTemplate.postForEntity("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messageId + "/modify", modReq, JsonNode.class);
                map.put("unread", false);
            } catch (Exception e) {
                log.warn("Could not mark email as read: {}", e.getMessage());
            }
        }

        return map;
    }

    private static class EmailContent {
        private String htmlBody = "";
        private String textBody = "";
        private final List<Map<String, Object>> attachments = new ArrayList<>();

        public String getHtmlBody() { return htmlBody; }
        public void setHtmlBody(String htmlBody) { this.htmlBody = htmlBody; }
        public String getTextBody() { return textBody; }
        public void setTextBody(String textBody) { this.textBody = textBody; }
        public List<Map<String, Object>> getAttachments() { return attachments; }
    }

    private void parsePayloadRecursive(JsonNode part, EmailContent content) {
        if (part == null) return;

        String mimeType = part.path("mimeType").asText("");
        String filename = part.path("filename").asText("");
        JsonNode bodyNode = part.path("body");
        String attachmentId = bodyNode.path("attachmentId").asText("");

        if (!filename.isEmpty() || !attachmentId.isEmpty()) {
            if (!filename.isEmpty()) {
                Map<String, Object> att = new HashMap<>();
                att.put("attachmentId", attachmentId);
                att.put("filename", filename);
                att.put("mimeType", mimeType);
                att.put("size", bodyNode.path("size").asLong(0));
                content.getAttachments().add(att);
            }
        }

        if (bodyNode.has("data")) {
            String data = decodeBase64Url(bodyNode.path("data").asText());
            if ("text/html".equalsIgnoreCase(mimeType) && content.getHtmlBody().isEmpty()) {
                content.setHtmlBody(data);
            } else if ("text/plain".equalsIgnoreCase(mimeType) && content.getTextBody().isEmpty()) {
                content.setTextBody(cleanEntityJunk(data));
            }
        }

        JsonNode parts = part.path("parts");
        if (parts.isArray()) {
            for (JsonNode subPart : parts) {
                parsePayloadRecursive(subPart, content);
            }
        }
    }

    public static String cleanEntityJunk(String input) {
        if (input == null) return "";
        Pattern numericEntity = Pattern.compile("&#(x?[0-9a-fA-F]+);");
        Matcher m = numericEntity.matcher(input);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            try {
                String codeStr = m.group(1);
                int codePoint = codeStr.startsWith("x") || codeStr.startsWith("X")
                        ? Integer.parseInt(codeStr.substring(1), 16)
                        : Integer.parseInt(codeStr);
                if (codePoint == 8199 || codePoint == 65279 || codePoint == 847 || codePoint == 8203 || codePoint == 8204 || codePoint == 8205) {
                    m.appendReplacement(sb, " ");
                } else {
                    m.appendReplacement(sb, Matcher.quoteReplacement(new String(Character.toChars(codePoint))));
                }
            } catch (Exception e) {
                m.appendReplacement(sb, "");
            }
        }
        m.appendTail(sb);
        String unescaped = sb.toString();

        unescaped = unescaped.replace("&nbsp;", " ")
                             .replace("&amp;", "&")
                             .replace("&lt;", "<")
                             .replace("&gt;", ">")
                             .replace("&quot;", "\"")
                             .replace("&#39;", "'");

        return unescaped.replaceAll("[\\u8199\\u65279\\u0847\\u200B\\u200C\\u200D\\uFEFF]+", " ")
                        .replaceAll("\\s+", " ")
                        .trim();
    }

    public ResponseEntity<byte[]> downloadAttachment(User user, String messageId, String attachmentId) {
        String token = getValidAccessToken(user);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messageId + "/attachments/" + attachmentId;
        ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);

        JsonNode node = response.getBody();
        if (node == null || !node.has("data")) {
            throw new RuntimeException("Attachment data not found");
        }

        String base64Data = node.get("data").asText();
        byte[] data = Base64.getUrlDecoder().decode(base64Data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    public Map<String, Object> sendMessage(User user, String to, String subject, String body) {
        String token = getValidAccessToken(user);

        try {
            Session session = Session.getDefaultInstance(new Properties(), null);
            MimeMessage email = new MimeMessage(session);

            Optional<OAuthCredential> credOpt = credentialRepository.findByUserAndProvider(user, "google");
            String fromAddress = credOpt.map(OAuthCredential::getEmail).orElse(user.getEmail());

            email.setFrom(new InternetAddress(fromAddress));
            email.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
            email.setSubject(subject, "UTF-8");
            email.setText(body, "UTF-8");

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            email.writeTo(buffer);
            String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(buffer.toByteArray());

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> reqBody = Map.of("raw", encodedEmail);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(reqBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", request, JsonNode.class);

            Map<String, Object> result = new HashMap<>();
            if (response.getBody() != null) {
                result.put("id", response.getBody().path("id").asText());
                result.put("threadId", response.getBody().path("threadId").asText());
            }
            result.put("status", "sent");
            return result;
        } catch (Exception e) {
            log.error("Failed to send email via Gmail API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void toggleStar(User user, String messageId, boolean star) {
        String token = getValidAccessToken(user);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        if (star) {
            body.put("addLabelIds", List.of("STARRED"));
        } else {
            body.put("removeLabelIds", List.of("STARRED"));
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messageId + "/modify", request, JsonNode.class);
    }

    public void trashMessage(User user, String messageId) {
        String token = getValidAccessToken(user);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<?> request = new HttpEntity<>(headers);
        restTemplate.postForEntity("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messageId + "/trash", request, JsonNode.class);
    }

    public void archiveMessage(User user, String messageId) {
        String token = getValidAccessToken(user);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of("removeLabelIds", List.of("INBOX"));
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messageId + "/modify", request, JsonNode.class);
    }

    private String getAvatarInitials(String name) {
        if (name == null || name.isEmpty()) return "👤";
        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2) {
            return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
        }
        return name.substring(0, Math.min(name.length(), 2)).toUpperCase();
    }

    private String formatEmailDate(String internalDateStr, String headerDate) {
        try {
            if (internalDateStr != null && !internalDateStr.isEmpty()) {
                long millis = Long.parseLong(internalDateStr);
                Instant instant = Instant.ofEpochMilli(millis);
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d").withZone(ZoneId.systemDefault());
                return formatter.format(instant);
            }
        } catch (Exception ignored) {}
        return headerDate != null && !headerDate.isEmpty() ? headerDate : "Recently";
    }

    private String determineTag(Set<String> labels, String subject) {
        if (labels.contains("CATEGORY_PROMOTIONS")) return "Promo";
        if (labels.contains("CATEGORY_SOCIAL")) return "Social";
        if (labels.contains("CATEGORY_UPDATES")) return "Updates";
        if (labels.contains("CATEGORY_FORUMS")) return "Forums";

        String lowerSub = subject != null ? subject.toLowerCase() : "";
        if (lowerSub.contains("design") || lowerSub.contains("ui") || lowerSub.contains("ux")) return "Design";
        if (lowerSub.contains("security") || lowerSub.contains("auth") || lowerSub.contains("password")) return "Security";
        if (lowerSub.contains("partner") || lowerSub.contains("invest") || lowerSub.contains("meet")) return "Partnership";
        if (lowerSub.contains("invoice") || lowerSub.contains("payment") || lowerSub.contains("billing")) return "Finance";
        return "Work";
    }
}
