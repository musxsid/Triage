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

    private final OAuthCredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GmailService(OAuthCredentialRepository credentialRepository, UserRepository userRepository) {
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
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
                .build()
                .toUriString();
    }

    public void handleOAuthCallback(String code, String username) {
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

        // Fetch user email from Google UserInfo
        String googleEmail = null;
        try {
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            HttpEntity<?> userReq = new HttpEntity<>(userHeaders);
            ResponseEntity<Map> userResp = restTemplate.exchange("https://www.googleapis.com/oauth2/v2/userinfo", HttpMethod.GET, userReq, Map.class);
            if (userResp.getBody() != null) {
                googleEmail = (String) userResp.getBody().get("email");
            }
        } catch (Exception e) {
            log.warn("Could not fetch userinfo from Google: {}", e.getMessage());
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

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
        map.put("preview", node.has("snippet") ? node.get("snippet").asText() : "");

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
        map.put("preview", node.path("snippet").asText());

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

        // Extract body
        String body = extractBody(node.path("payload"));
        if (body == null || body.trim().isEmpty()) {
            body = node.path("snippet").asText();
        }
        map.put("body", body);

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

    private String extractBody(JsonNode payload) {
        if (payload == null) return "";

        String mimeType = payload.path("mimeType").asText();
        JsonNode bodyNode = payload.path("body");

        if (bodyNode.has("data") && (mimeType.startsWith("text/plain") || mimeType.startsWith("text/html"))) {
            return decodeBase64Url(bodyNode.path("data").asText());
        }

        JsonNode parts = payload.path("parts");
        if (parts.isArray()) {
            // First check for plain text
            for (JsonNode part : parts) {
                String partMime = part.path("mimeType").asText();
                if ("text/plain".equalsIgnoreCase(partMime) && part.path("body").has("data")) {
                    return decodeBase64Url(part.path("body").path("data").asText());
                }
            }
            // Next check for text/html
            for (JsonNode part : parts) {
                String partMime = part.path("mimeType").asText();
                if ("text/html".equalsIgnoreCase(partMime) && part.path("body").has("data")) {
                    String html = decodeBase64Url(part.path("body").path("data").asText());
                    return stripHtmlTags(html);
                }
            }
            // Recurse into nested parts
            for (JsonNode part : parts) {
                String res = extractBody(part);
                if (res != null && !res.trim().isEmpty()) return res;
            }
        }

        return "";
    }

    private String decodeBase64Url(String data) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(data);
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private String stripHtmlTags(String html) {
        if (html == null) return "";
        return html.replaceAll("<style([\\s\\S]+?)</style>", "")
                .replaceAll("<script([\\s\\S]+?)</script>", "")
                .replaceAll("<[^>]*>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
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
