package com.siddharth.simplynotes.searchservice.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Value("${note.service.url:http://localhost:8082}")
    private String noteServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping
    public ResponseEntity<?> search(@RequestParam(value = "query", defaultValue = "") String query,
                                   @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        List<Map<String, Object>> results = new ArrayList<>();
        String lowerQuery = query.toLowerCase().trim();

        try {
            // Fetch Notes from note-service
            ResponseEntity<List> notesResp = restTemplate.exchange(
                    noteServiceUrl + "/api/notes",
                    HttpMethod.GET,
                    requestEntity,
                    List.class
            );

            if (notesResp.getBody() != null) {
                List<Map<String, Object>> notes = (List<Map<String, Object>>) notesResp.getBody();
                for (Map<String, Object> note : notes) {
                    String title = (String) note.getOrDefault("title", "");
                    String content = (String) note.getOrDefault("content", "");
                    if (lowerQuery.isEmpty() || title.toLowerCase().contains(lowerQuery) || content.toLowerCase().contains(lowerQuery)) {
                        results.add(Map.of(
                                "id", note.get("id"),
                                "title", title.isEmpty() ? "Untitled Note" : title,
                                "type", "note",
                                "url", "/notes/" + note.get("id")
                        ));
                    }
                }
            }

            // Fetch Workspaces from note-service
            ResponseEntity<List> wsResp = restTemplate.exchange(
                    noteServiceUrl + "/api/workspaces",
                    HttpMethod.GET,
                    requestEntity,
                    List.class
            );

            if (wsResp.getBody() != null) {
                List<Map<String, Object>> workspaces = (List<Map<String, Object>>) wsResp.getBody();
                for (Map<String, Object> ws : workspaces) {
                    String name = (String) ws.getOrDefault("name", "");
                    if (lowerQuery.isEmpty() || name.toLowerCase().contains(lowerQuery)) {
                        results.add(Map.of(
                                "id", ws.get("id"),
                                "title", name,
                                "type", "workspace",
                                "url", "/workspaces"
                        ));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return ResponseEntity.ok(results);
    }
}
