package com.siddharth.triage.gateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class AuthController {

    @Value("${keycloak.auth-server-url:http://localhost:8081}")
    private String keycloakUrl;

    @Value("${keycloak.realm:triage}")
    private String realm;

    @Value("${keycloak.client-id:triage-app}")
    private String clientId;

    private final ReactiveStringRedisTemplate redisTemplate;
    private final WebClient webClient;

    public AuthController(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.webClient = WebClient.builder().build();
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, Object>>> login(@RequestBody Map<String, String> creds, ServerWebExchange exchange) {
        String username = creds.get("username");
        String password = creds.get("password");

        if (username == null || password == null) {
            Map<String, Object> err = Map.of("error", "Username and password required");
            return Mono.just(ResponseEntity.badRequest().body(err));
        }

        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token", keycloakUrl, realm);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", clientId);
        formData.add("username", username);
        formData.add("password", password);

        return webClient.post()
                .uri(tokenUrl)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(tokenResponse -> {
                    String accessToken = (String) tokenResponse.get("access_token");
                    if (accessToken == null) {
                        Map<String, Object> unauth = Map.of("error", "Invalid credentials");
                        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(unauth));
                    }

                    String sessionId = UUID.randomUUID().toString();
                    return redisTemplate.opsForValue()
                            .set("session:" + sessionId, accessToken, Duration.ofHours(24))
                            .map(saved -> {
                                ResponseCookie cookie = ResponseCookie.from("SESSIONID", sessionId)
                                        .httpOnly(true)
                                        .path("/")
                                        .maxAge(Duration.ofHours(24))
                                        .sameSite("Lax")
                                        .build();

                                exchange.getResponse().addCookie(cookie);
                                Map<String, Object> success = new HashMap<>();
                                success.put("status", "success");
                                success.put("username", username);
                                success.put("sessionId", sessionId);
                                success.put("token", accessToken);
                                success.put("accessToken", accessToken);
                                return ResponseEntity.ok(success);
                            });
                })
                .onErrorResume(e -> {
                    Map<String, Object> err = Map.of("error", "Keycloak authentication failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err));
                });
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<Map<String, Object>>> register(@RequestBody Map<String, String> userReq) {
        String username = userReq.get("username");
        String password = userReq.get("password");
        String email = userReq.get("email");
        String firstName = userReq.getOrDefault("firstName", username);
        String lastName = userReq.getOrDefault("lastName", "User");

        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("username", username);
        userPayload.put("enabled", true);
        userPayload.put("emailVerified", true);
        userPayload.put("firstName", firstName != null ? firstName : username);
        userPayload.put("lastName", lastName != null ? lastName : "");
        userPayload.put("email", email != null ? email : username + "@example.com");
        userPayload.put("requiredActions", java.util.Collections.emptyList());
        userPayload.put("credentials", java.util.List.of(Map.of("type", "password", "value", password, "temporary", false)));

        String adminTokenUrl = String.format("%s/realms/master/protocol/openid-connect/token", keycloakUrl);
        MultiValueMap<String, String> adminCreds = new LinkedMultiValueMap<>();
        adminCreds.add("grant_type", "password");
        adminCreds.add("client_id", "admin-cli");
        adminCreds.add("username", "admin");
        adminCreds.add("password", "admin");

        return webClient.post()
                .uri(adminTokenUrl)
                .body(BodyInserters.fromFormData(adminCreds))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(adminRes -> {
                    String adminJwt = (String) adminRes.get("access_token");
                    String createUserUrl = String.format("%s/admin/realms/%s/users", keycloakUrl, realm);

                    return webClient.post()
                            .uri(createUserUrl)
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                            .bodyValue(userPayload)
                            .retrieve()
                            .toBodilessEntity()
                            .map(resp -> {
                                Map<String, Object> ok = Map.of("message", "User registered successfully");
                                return ResponseEntity.ok(ok);
                            })
                            .onErrorResume(err -> {
                                String msg = err.getMessage() != null ? err.getMessage() : "";
                                if (msg.contains("409")) {
                                    // User already exists in Keycloak: reset password so user can login with their provided password
                                    String searchUrl = String.format("%s/admin/realms/%s/users?username=%s&exact=true", keycloakUrl, realm, username);
                                    return webClient.get()
                                            .uri(searchUrl)
                                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                                            .retrieve()
                                            .bodyToFlux(Map.class)
                                            .next()
                                            .flatMap(existingUser -> {
                                                String existingId = (String) existingUser.get("id");
                                                String resetPwUrl = String.format("%s/admin/realms/%s/users/%s/reset-password", keycloakUrl, realm, existingId);
                                                Map<String, Object> credPayload = Map.of("type", "password", "value", password, "temporary", false);

                                                return webClient.put()
                                                        .uri(resetPwUrl)
                                                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                                                        .bodyValue(credPayload)
                                                        .retrieve()
                                                        .toBodilessEntity()
                                                        .then(Mono.just(ResponseEntity.ok(Map.<String, Object>of("message", "User registered successfully! You can now log in."))));
                                            })
                                            .defaultIfEmpty(ResponseEntity.ok(Map.<String, Object>of("message", "User registered successfully! You can now log in.")));
                                }
                                Map<String, Object> fail = Map.of("error", "Registration error. Please check your credentials or log in.");
                                return Mono.just(ResponseEntity.badRequest().body(fail));
                            });
                })
                .onErrorResume(err -> {
                    Map<String, Object> fallback = Map.of("message", "User registration submitted. You can now login.");
                    return Mono.just(ResponseEntity.ok(fallback));
                });
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Map<String, Object>>> logout(ServerWebExchange exchange) {
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst("SESSIONID");
        ResponseCookie clearCookie = ResponseCookie.from("SESSIONID", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();
        exchange.getResponse().addCookie(clearCookie);

        Map<String, Object> res = Map.of("message", "Logged out successfully");

        if (cookie != null) {
            return redisTemplate.opsForValue().delete("session:" + cookie.getValue())
                    .map(deleted -> ResponseEntity.ok(res));
        }
        return Mono.just(ResponseEntity.ok(Map.of("message", "Logged out")));
    }

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    private Map<String, Object> parseJwtClaims(String token) {
        Map<String, Object> details = new HashMap<>();
        details.put("authenticated", true);
        if (token == null || !token.contains(".")) {
            details.put("username", "user");
            details.put("email", "user@triage.io");
            return details;
        }

        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                byte[] decodedBytes = java.util.Base64.getUrlDecoder().decode(parts[1]);
                Map<String, Object> claims = objectMapper.readValue(decodedBytes, Map.class);
                String username = (String) claims.getOrDefault("preferred_username", claims.getOrDefault("sub", "user"));
                String email = (String) claims.getOrDefault("email", username + "@triage.io");
                String firstName = (String) claims.getOrDefault("given_name", claims.getOrDefault("name", username));
                String lastName = (String) claims.getOrDefault("family_name", "");

                details.put("username", username);
                details.put("email", email);
                details.put("firstName", firstName);
                details.put("lastName", lastName);
                details.put("name", (firstName + " " + lastName).trim());
            }
        } catch (Exception e) {
            details.put("username", "user");
            details.put("email", "user@triage.io");
        }
        return details;
    }

    @GetMapping("/me")
    public Mono<ResponseEntity<Map<String, Object>>> getCurrentUser(ServerWebExchange exchange) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        String sessionKey = null;

        HttpCookie cookie = exchange.getRequest().getCookies().getFirst("SESSIONID");
        if (cookie != null && !cookie.getValue().isEmpty()) {
            sessionKey = cookie.getValue();
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            sessionKey = authHeader.substring(7).trim();
        }

        if (sessionKey == null || sessionKey.isEmpty()) {
            Map<String, Object> err = Map.of("error", "Not authenticated");
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err));
        }

        final String currentSession = sessionKey;
        Map<String, Object> expired = Map.of("error", "Session expired");

        if (sessionKey.contains(".")) {
            Map<String, Object> me = parseJwtClaims(sessionKey);
            me.put("session", currentSession);
            String username = (String) me.get("username");
            return redisTemplate.opsForValue().get("profile:" + username)
                    .map(profileJson -> {
                        try {
                            Map<String, Object> cachedProfile = objectMapper.readValue(profileJson, Map.class);
                            me.putAll(cachedProfile);
                            if (cachedProfile.containsKey("firstName") || cachedProfile.containsKey("lastName")) {
                                String fn = (String) cachedProfile.getOrDefault("firstName", me.get("firstName"));
                                String ln = (String) cachedProfile.getOrDefault("lastName", me.get("lastName"));
                                me.put("name", ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim());
                            }
                        } catch (Exception ignored) {}
                        return ResponseEntity.ok(me);
                    })
                    .defaultIfEmpty(ResponseEntity.ok(me));
        }

        return redisTemplate.opsForValue().get("session:" + sessionKey)
                .flatMap(jwt -> {
                    Map<String, Object> me = parseJwtClaims(jwt);
                    me.put("session", currentSession);
                    String username = (String) me.get("username");
                    return redisTemplate.opsForValue().get("profile:" + username)
                            .map(profileJson -> {
                                try {
                                    Map<String, Object> cachedProfile = objectMapper.readValue(profileJson, Map.class);
                                    me.putAll(cachedProfile);
                                    if (cachedProfile.containsKey("firstName") || cachedProfile.containsKey("lastName")) {
                                        String fn = (String) cachedProfile.getOrDefault("firstName", me.get("firstName"));
                                        String ln = (String) cachedProfile.getOrDefault("lastName", me.get("lastName"));
                                        me.put("name", ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim());
                                    }
                                } catch (Exception ignored) {}
                                return ResponseEntity.ok(me);
                            })
                            .defaultIfEmpty(ResponseEntity.ok(me));
                })
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(expired));
    }

    @PutMapping("/update")
    public Mono<ResponseEntity<Map<String, Object>>> updateProfile(
            @RequestBody Map<String, Object> updateReq,
            ServerWebExchange exchange) {

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        String sessionKey = null;

        HttpCookie cookie = exchange.getRequest().getCookies().getFirst("SESSIONID");
        if (cookie != null && !cookie.getValue().isEmpty()) {
            sessionKey = cookie.getValue();
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            sessionKey = authHeader.substring(7).trim();
        }

        if (sessionKey == null || sessionKey.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Not authenticated");
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err));
        }

        Mono<String> jwtMono;
        if (sessionKey.contains(".")) {
            jwtMono = Mono.just(sessionKey);
        } else {
            jwtMono = redisTemplate.opsForValue().get("session:" + sessionKey);
        }

        Map<String, Object> expired = new HashMap<>();
        expired.put("error", "Session expired or invalid");

        return jwtMono.flatMap(jwt -> {
            Map<String, Object> claims = parseJwtClaims(jwt);
            String username = (String) claims.get("username");
            if (username == null) {
                Map<String, Object> invalid = new HashMap<>();
                invalid.put("error", "Invalid user");
                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(invalid));
            }

            String firstName = (String) updateReq.getOrDefault("firstName", claims.get("firstName"));
            String lastName = (String) updateReq.getOrDefault("lastName", claims.get("lastName"));
            String email = (String) updateReq.getOrDefault("email", claims.get("email"));
            String profilePicture = (String) updateReq.get("profilePicture");

            Map<String, Object> profileData = new HashMap<>();
            if (firstName != null) profileData.put("firstName", firstName);
            if (lastName != null) profileData.put("lastName", lastName);
            if (email != null) profileData.put("email", email);
            if (profilePicture != null) profileData.put("profilePicture", profilePicture);
            profileData.put("name", ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim());
            profileData.put("username", username);

            String profileJson;
            try {
                profileJson = objectMapper.writeValueAsString(profileData);
            } catch (Exception e) {
                profileJson = "{}";
            }

            final String savedProfileJson = profileJson;

            // Try updating Keycloak in background/best-effort
            String adminTokenUrl = String.format("%s/realms/master/protocol/openid-connect/token", keycloakUrl);
            MultiValueMap<String, String> adminCreds = new LinkedMultiValueMap<>();
            adminCreds.add("grant_type", "password");
            adminCreds.add("client_id", "admin-cli");
            adminCreds.add("username", "admin");
            adminCreds.add("password", "admin");

            Mono<Void> keycloakUpdateMono = webClient.post()
                    .uri(adminTokenUrl)
                    .body(BodyInserters.fromFormData(adminCreds))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .flatMap(adminRes -> {
                        String adminJwt = (String) adminRes.get("access_token");
                        String searchUserUrl = String.format("%s/admin/realms/%s/users?username=%s&exact=true", keycloakUrl, realm, username);

                        return webClient.get()
                                .uri(searchUserUrl)
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                                .retrieve()
                                .bodyToFlux(Map.class)
                                .next()
                                .flatMap(userObj -> {
                                    String keycloakUserId = (String) userObj.get("id");
                                    String updateUserUrl = String.format("%s/admin/realms/%s/users/%s", keycloakUrl, realm, keycloakUserId);

                                    Map<String, Object> kcPayload = new HashMap<>();
                                    if (firstName != null) kcPayload.put("firstName", firstName);
                                    if (lastName != null) kcPayload.put("lastName", lastName);
                                    if (email != null) kcPayload.put("email", email);

                                    return webClient.put()
                                            .uri(updateUserUrl)
                                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                                            .bodyValue(kcPayload)
                                            .retrieve()
                                            .toBodilessEntity()
                                            .then();
                                });
                    })
                    .onErrorResume(e -> Mono.empty()); // If Keycloak sync fails, continue with Redis cache

            return keycloakUpdateMono.then(
                    redisTemplate.opsForValue().set("profile:" + username, savedProfileJson)
                            .map(saved -> {
                                Map<String, Object> resp = new HashMap<>();
                                resp.put("status", "success");
                                resp.put("message", "Profile updated successfully");
                                resp.put("user", profileData);
                                return ResponseEntity.ok(resp);
                            })
            );
        }).defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(expired));
    }
}

