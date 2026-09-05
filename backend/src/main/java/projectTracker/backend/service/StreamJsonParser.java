package projectTracker.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import projectTracker.backend.dto.internal.InterviewTurnResult;
import projectTracker.backend.dto.internal.Question;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class StreamJsonParser {

    private static final String QUESTIONS_OPEN = "<portal-questions>";
    private static final String QUESTIONS_CLOSE = "</portal-questions>";
    private static final String DONE_MARKER = "<portal-done>";

    private final ObjectMapper objectMapper;

    public StreamJsonParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public InterviewTurnResult parse(String stdout) {
        String initSessionId = null;
        String anySessionId = null;
        String resultText = null;
        boolean success = false;
        String lastAssistantText = null;

        if (stdout != null) {
            for (String line : stdout.split("\n", -1)) {
                String trimmed = line.strip();
                if (trimmed.isEmpty()) {
                    continue;
                }
                JsonNode node = readTreeQuietly(trimmed);
                if (node == null || !node.isObject()) {
                    continue;
                }

                if (node.hasNonNull("session_id")) {
                    String sessionId = node.get("session_id").asText();
                    if (!sessionId.isBlank()) {
                        anySessionId = sessionId;
                    }
                }

                String type = node.path("type").asText("");
                switch (type) {
                    case "system" -> {
                        if ("init".equals(node.path("subtype").asText("")) && node.hasNonNull("session_id")) {
                            initSessionId = node.get("session_id").asText();
                        }
                    }
                    case "assistant" -> {
                        String assistantText = extractAssistantText(node);
                        if (assistantText != null && !assistantText.isBlank()) {
                            lastAssistantText = assistantText;
                        }
                    }
                    case "result" -> {
                        if (node.hasNonNull("result")) {
                            resultText = node.get("result").asText();
                        }
                        boolean isError = node.path("is_error").asBoolean(false);
                        boolean successSubtype = "success".equals(node.path("subtype").asText(""));
                        success = successSubtype && !isError;
                    }
                    default -> {
                    }
                }
            }
        }

        String sessionId = initSessionId != null ? initSessionId : anySessionId;
        String finalText = resultText != null
                ? resultText
                : (lastAssistantText != null ? lastAssistantText : "");

        boolean done = finalText.contains(DONE_MARKER);
        String doneSummary = done ? extractDoneSummary(finalText) : null;

        QuestionParseOutcome questions = extractQuestions(finalText);

        return new InterviewTurnResult(
                sessionId,
                finalText,
                success,
                questions.questions(),
                done,
                doneSummary,
                questions.malformed()
        );
    }

    private JsonNode readTreeQuietly(String line) {
        try {
            return objectMapper.readTree(line);
        } catch (Exception e) {
            return null;
        }
    }

    private String extractAssistantText(JsonNode node) {
        JsonNode content = node.path("message").path("content");
        if (!content.isArray()) {
            return null;
        }
        StringBuilder builder = new StringBuilder();
        for (JsonNode part : content) {
            if ("text".equals(part.path("type").asText(""))) {
                builder.append(part.path("text").asText(""));
            }
        }
        return builder.toString();
    }

    private String extractDoneSummary(String finalText) {
        int index = finalText.indexOf(DONE_MARKER);
        if (index < 0) {
            return null;
        }
        String summary = finalText.substring(index + DONE_MARKER.length()).strip();
        return summary.isEmpty() ? null : summary;
    }

    private QuestionParseOutcome extractQuestions(String finalText) {
        int openIndex = finalText.indexOf(QUESTIONS_OPEN);
        if (openIndex < 0) {
            return new QuestionParseOutcome(List.of(), false);
        }
        int jsonStart = openIndex + QUESTIONS_OPEN.length();
        int closeIndex = finalText.indexOf(QUESTIONS_CLOSE, jsonStart);
        String rawJson = closeIndex >= 0
                ? finalText.substring(jsonStart, closeIndex)
                : finalText.substring(jsonStart);
        rawJson = rawJson.strip();

        try {
            JsonNode array = objectMapper.readTree(rawJson);
            if (array == null || !array.isArray()) {
                return new QuestionParseOutcome(List.of(), true);
            }
            List<Question> questions = new ArrayList<>();
            for (JsonNode element : array) {
                questions.add(toQuestion(element));
            }
            return new QuestionParseOutcome(questions, false);
        } catch (Exception e) {
            log.warn("<portal-questions> blogu ayristirilamadi", e);
            return new QuestionParseOutcome(List.of(), true);
        }
    }

    private Question toQuestion(JsonNode element) {
        String id = element.hasNonNull("id") ? element.get("id").asText() : null;
        String text = element.hasNonNull("text") ? element.get("text").asText() : null;
        String type = element.hasNonNull("type") ? element.get("type").asText() : null;
        String placeholder = element.hasNonNull("placeholder") ? element.get("placeholder").asText() : null;

        List<String> choices = new ArrayList<>();
        JsonNode choicesNode = element.path("choices");
        if (choicesNode.isArray()) {
            for (JsonNode choice : choicesNode) {
                choices.add(choice.asText());
            }
        }
        return new Question(id, text, type, choices, placeholder);
    }

    private record QuestionParseOutcome(List<Question> questions, boolean malformed) {
    }
}
