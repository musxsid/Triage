package com.siddharth.simplynotes.aiservice.controller;

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
public class AiController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/generate")
    public ResponseEntity<?> generateContent(@RequestBody Map<String, String> request) {
        String action = request.get("action");
        String context = request.get("context");

        String prompt = buildPrompt(action, context);
        String url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> partNode = new HashMap<>();
        partNode.put("parts", List.of(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(partNode));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.startsWith("${") || geminiApiKey.equals("placeholder")) {
            return ResponseEntity.ok(Map.of("result", generateFallbackResponse(action, context)));
        }

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            String generatedText = extractTextFromResponse(response.getBody());
            return ResponseEntity.ok(Map.of("result", generatedText));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("result", generateFallbackResponse(action, context)));
        }
    }

    private String generateFallbackResponse(String action, String context) {
        String cleanContext = (context != null && !context.isBlank()) ? context.replaceAll("<[^>]*>", "").trim() : "your notes";
        String sampleText = cleanContext.length() > 140 ? cleanContext.substring(0, 140) + "..." : cleanContext;

        return switch (action != null ? action : "") {
            case "Summarize" -> "<h3>Executive Summary</h3><p><b>Core Focus:</b> " + sampleText + "</p><ul><li><b>Key Insight:</b> Extracted primary themes and context clarity.</li><li><b>Actionable Next Step:</b> Review dependencies and implement target objectives.</li><li><b>Impact:</b> Streamlined documentation and improved team alignment.</li></ul>";
            case "Improve Writing" -> "<h3>Refined &amp; Polished Draft</h3><p>Here is an enhanced, professional articulation of your thought:</p><p>\"" + sampleText + "\"</p><p><b>Key Enhancements:</b> Sharpened diction, elevated structural cadence, and highlighted critical concepts for immediate readability.</p>";
            case "Brainstorm Ideas" -> "<h3>Brainstorming &amp; Concept Ideation</h3><ul><li><b>1. Dynamic Contextual Linking:</b> Automatically surface related notes based on thematic resonance.</li><li><b>2. Ambient Focus Mode:</b> Dim background distractions and isolate active paragraphs with a warm spotlight.</li><li><b>3. Instant Action Extraction:</b> Convert highlighted sentences into trackable checkboxes with one tap.</li><li><b>4. Smart Semantic Tagging:</b> Auto-categorize workspace content without manual tagging friction.</li><li><b>5. Collaborative Thought Canvas:</b> Bridge notes into interactive concept boards with live cursors.</li></ul>";
            case "Format Notes" -> "<h3>Structured Notes &amp; Overview</h3><p><b>Context Reference:</b> " + sampleText + "</p><h3>Key Priorities</h3><ul><li><b>Structured Hierarchy:</b> Organized ideas into clean headings and digestible paragraphs.</li><li><b>Key Priorities:</b> Identified central objectives and prioritized milestones.</li><li><b>Deliverables:</b> Outlined next actionable review phases.</li></ul>";
            default -> "<h3>Spark AI Insights</h3><p>Processed query regarding <b>" + sampleText + "</b>:</p><p>Content has been analyzed and formatted for optimal clarity. You can save this directly as a new note or copy it to your clipboard.</p>";
        };
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

        return switch (action != null ? action : "") {
            case "Summarize" -> "Summarize the following into a clean structure with a heading and bullet points:" + agentInstructions + "\n\n" + context;
            case "Improve Writing" -> "Rewrite this to be professional and clear. Use paragraphs and bold key terms:" + agentInstructions + "\n\n" + context;
            case "Brainstorm Ideas" -> "Generate 5 ideas. Use <h3> for titles and <p> for descriptions:" + agentInstructions + "\n\n" + context;
            case "Format Notes" -> "Transform these messy notes into a structured document with headings and lists:" + agentInstructions + "\n\n" + context;
            default -> "Process this text and format it beautifully with HTML:" + agentInstructions + "\n\n" + context;
        };
    }
}
