package com.siddharth.simplynotes.gateway.controller;

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
public class AuthController {

    @Value("${keycloak.auth-server-url:http://localhost:8081}")
    private String keycloakUrl;

    @Value("${keycloak.realm:simplynotes}")
    private String realm;

    @Value("${keycloak.client-id:simplynotes-app}")
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
                                Map<String, Object> success = Map.of(
                                        "status", "success",
                                        "username", username,
                                        "sessionId", sessionId
                                );
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

        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("username", username);
        userPayload.put("enabled", true);
        userPayload.put("email", email != null ? email : username + "@example.com");
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
                                Map<String, Object> fail = Map.of("error", "User creation failed: " + err.getMessage());
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

    @GetMapping("/me")
    public Mono<ResponseEntity<Map<String, Object>>> getCurrentUser(ServerWebExchange exchange) {
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst("SESSIONID");
        if (cookie == null) {
            Map<String, Object> err = Map.of("error", "Not authenticated");
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err));
        }

        Map<String, Object> me = Map.of("authenticated", true, "session", cookie.getValue());
        Map<String, Object> expired = Map.of("error", "Session expired");

        return redisTemplate.opsForValue().get("session:" + cookie.getValue())
                .map(jwt -> ResponseEntity.ok(me))
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(expired));
    }
}
