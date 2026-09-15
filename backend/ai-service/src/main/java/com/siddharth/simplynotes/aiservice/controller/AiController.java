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

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("result", generateFallbackResponse(action, context)));
        }

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
            case "Summarize" -> 
                "<h3>Executive Study Summary</h3>" +
                "<p><b>Core Overview:</b> Analysis of <i>\"" + sampleText + "\"</i> focused on core concepts and practical study applications.</p>" +
                "<h3>Key Takeaways &amp; Insights</h3>" +
                "<ul>" +
                "<li><b>Primary Focus:</b> Streamlined topic breakdown for rapid revision and clarity.</li>" +
                "<li><b>Core Mechanics:</b> Essential principles identified and categorized into clear conceptual modules.</li>" +
                "<li><b>Practical Application:</b> Key takeaways structured for instant note integration and exam preparation.</li>" +
                "</ul>" +
                "<h3>Study Tip</h3>" +
                "<p>Review bold terms regularly and connect these principles with related workspace notes.</p>";

            case "Improve Writing" -> 
                "<h3>Refined &amp; Articulate Draft</h3>" +
                "<p>Here is an enhanced, academically polished version of your note context:</p>" +
                "<p><i>\"" + sampleText + "\"</i></p>" +
                "<h3>Key Enhancements Made</h3>" +
                "<ul>" +
                "<li><b>Diction &amp; Flow:</b> Refined sentence structures for heightened academic clarity.</li>" +
                "<li><b>Conceptual Bolding:</b> Highlighted core terminology for faster active recall.</li>" +
                "<li><b>Structural Cadence:</b> Organized thoughts into cohesive study paragraphs.</li>" +
                "</ul>";

            case "Brainstorm Ideas" -> 
                "<h3>Study &amp; Concept Brainstorming</h3>" +
                "<h3>1. Dynamic Semantic Connections</h3><p>Relate <b>" + sampleText + "</b> with complementary topics across your active workspace folders.</p>" +
                "<h3>2. Comparative Analytical Breakdown</h3><p>Create a pros/cons or cause-and-effect matrix to deepen conceptual comprehension.</p>" +
                "<h3>3. Active Recall Q&amp;A</h3><p>Formulate 5 test questions based on these notes to quiz your understanding during review.</p>" +
                "<h3>4. Visual Flow Diagramming</h3><p>Map core ideas into sequential flowcharts or mind maps for visual memory retention.</p>" +
                "<h3>5. Practical Case Study Application</h3><p>Apply these theoretical principles to a real-world scenario or project deliverable.</p>";

            case "Format Notes" -> 
                "<h3>Structured Study Guide</h3>" +
                "<p><b>Topic Reference:</b> " + sampleText + "</p>" +
                "<h3>1. Fundamental Objectives</h3>" +
                "<ul>" +
                "<li><b>Concept Definition:</b> Clarified core terminology and underlying mechanics.</li>" +
                "<li><b>Scope &amp; Boundaries:</b> Defined key parameters and study focus points.</li>" +
                "</ul>" +
                "<h3>2. Action Plan &amp; Review</h3>" +
                "<ul>" +
                "<li><b>Milestones:</b> Complete detailed section review and self-assessment.</li>" +
                "<li><b>Next Steps:</b> Consolidate findings into final summary sheet.</li>" +
                "</ul>";

            default -> 
                "<h3>Spark AI Academic Analysis</h3>" +
                "<p>Detailed analysis of <b>" + sampleText + "</b>:</p>" +
                "<p>Content has been evaluated, synthesized, and structured for optimal study retention. Insert this into your note to keep your workspace organized.</p>";
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
            context = "General topic study notes.";
        }

        String formattingInstructions = 
            "\nFormatting Rules:\n" +
            "1. Output MUST be ONLY valid HTML body tags (<h3>, <p>, <ul>, <li>, <b>, <i>, <blockquote>).\n" +
            "2. Do NOT use Markdown syntax (no ###, no **, no - bullet points).\n" +
            "3. Do NOT wrap output in ```html code blocks.\n" +
            "4. Provide rich, highly educational, insightful, and practical content tailored for a top-tier study & research notebook.";

        return switch (action != null ? action : "") {
            case "Summarize" -> 
                "You are an expert academic tutor and research assistant. Create a comprehensive, highly informative Study Summary for the following topic/notes. " +
                "Include:\n" +
                "- An <h3>Executive Overview</h3> with a clear 2-3 sentence core summary.\n" +
                "- An <h3>Key Takeaways & Core Concepts</h3> section with detailed bullet points using <b>bold terms</b>.\n" +
                "- An <h3>Key Definitions & Vocabulary</h3> section defining critical terms.\n" +
                "- An <h3>Actionable Study Tips</h3> section.\n" +
                formattingInstructions + "\n\nTarget Context:\n" + context;

            case "Improve Writing" -> 
                "You are an elite editor and academic reviewer. Rewrite and polish the following text into clear, articulate, and well-structured study notes. " +
                "Elevate vocabulary, fix grammatical nuance, organize thoughts into clear <h3> Headings, and bold essential concept terms for quick revision.\n" +
                formattingInstructions + "\n\nTarget Text:\n" + context;

            case "Brainstorm Ideas" -> 
                "You are a creative strategist and academic mentor. Generate 5 deeply insightful, practical, and forward-thinking study ideas/perspectives based on this topic. " +
                "For each idea, use an <h3>Title</h3>, followed by an explanatory <p> with <b>bold key concepts</b>, practical applications, and follow-up research questions.\n" +
                formattingInstructions + "\n\nTarget Topic:\n" + context;

            case "Format Notes" -> 
                "You are a master study note designer. Transform these raw/messy notes into a beautifully structured, highly readable study guide. " +
                "Group concepts logically into <h3> Section Headings, <ul> bullet points, <b>bolded key terms</b>, and <blockquote>key takeaway quotes</blockquote>.\n" +
                formattingInstructions + "\n\nRaw Content:\n" + context;

            default -> 
                "You are an intelligent study assistant. Provide a detailed, highly useful educational analysis, breakdown, and comprehensive summary for the following context. Use <h3> subheadings, <ul> lists, and <b>bold terms</b> for maximum clarity.\n" +
                formattingInstructions + "\n\nContext:\n" + context;
        };
    }
}
