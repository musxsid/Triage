package com.siddharth.simplynotes.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/generate")
    public ResponseEntity<?> generateContent(@RequestBody Map<String, String> request) {
        String action = request.get("action");
        String context = request.get("context");

        String prompt = buildPrompt(action, context);
String url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;        // Construct Gemini Request Body
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> partNode = new HashMap<>();
        partNode.put("parts", List.of(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(partNode));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            String generatedText = extractTextFromResponse(response.getBody());
            return ResponseEntity.ok(Map.of("result", generatedText));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Spark is offline. Check backend logs."));
        }
    }

    private String extractTextFromResponse(Map<String, Object> body) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "Error parsing AI response.";
        }
    }
private String buildPrompt(String action, String context) {
    if (context == null || context.trim().isEmpty()) {
        context = "No text selected.";
    }

    String agentInstructions = 
        " Return ONLY the raw HTML body. " +
        "Use <h3> for subheadings, <p> for paragraphs, <b> for bolding, and <ul>/<li> for lists. " +
        "CRITICAL: Do NOT use Markdown (no stars ***, no dashes). Do NOT wrap the response in ```html code fences. " +
        "Format it like a professional document.";

    return switch (action) {
        case "Summarize" -> "Summarize the following into a clean structure with a heading and bullet points:" + agentInstructions + "\n\n" + context;
        case "Improve Writing" -> "Rewrite this to be professional and clear. Use paragraphs and bold key terms:" + agentInstructions + "\n\n" + context;
        case "Brainstorm Ideas" -> "Generate 5 ideas. Use <h3> for titles and <p> for descriptions:" + agentInstructions + "\n\n" + context;
        case "Format Notes" -> "Transform these messy notes into a structured document with headings and lists:" + agentInstructions + "\n\n" + context;
        default -> "Process this text and format it beautifully with HTML:" + agentInstructions + "\n\n" + context;
    };
}
}
    
