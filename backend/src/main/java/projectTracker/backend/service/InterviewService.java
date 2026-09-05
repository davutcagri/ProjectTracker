package projectTracker.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ProjectDocs;
import projectTracker.backend.dto.internal.Question;
import projectTracker.backend.dto.request.AnswerItem;
import projectTracker.backend.dto.response.InterviewStatusResponse;
import projectTracker.backend.model.entity.InterviewSession;
import projectTracker.backend.model.entity.Project;
import projectTracker.backend.model.enums.InterviewStatus;
import projectTracker.backend.repository.InterviewSessionRepository;
import projectTracker.backend.repository.ProjectRepository;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Slf4j
@Service
public class InterviewService {

    private static final List<InterviewStatus> ACTIVE_STATUSES = List.of(InterviewStatus.RUNNING, InterviewStatus.WAITING_INPUT);
    private static final String TASK_PROMPT =
            "Bu projenin kök dizininde eksik olan README.md / SCOPE.md / ROADMAP.md dosyalarını oluştur. "
                    + "Gerekli bilgiyi kullanıcıya sorarak topla.";

    private final ProjectRepository projectRepository;
    private final ProjectDocsReader projectDocsReader;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewExecutor interviewExecutor;
    private final ObjectMapper objectMapper;

    public InterviewService(ProjectRepository projectRepository,
                            ProjectDocsReader projectDocsReader,
                            InterviewSessionRepository sessionRepository,
                            InterviewExecutor interviewExecutor,
                            ObjectMapper objectMapper) {
        this.projectRepository = projectRepository;
        this.projectDocsReader = projectDocsReader;
        this.sessionRepository = sessionRepository;
        this.interviewExecutor = interviewExecutor;
        this.objectMapper = objectMapper;
    }

    public InterviewStatusResponse start(String projectId) throws IOException {
        Project project = findProject(projectId);

        List<ProjectDocs> docs = projectDocsReader.readInnerFiles(Path.of(project.getPath()));
        if (docs.stream().allMatch(ProjectDocs::exists)) {
            throw new IllegalStateException("Bu projenin tüm dokümanları zaten mevcut");
        }

        sessionRepository.findByProjectId(projectId).ifPresent(sessionRepository::delete);

        if (sessionRepository.existsByStatusIn(ACTIVE_STATUSES)) {
            throw new IllegalStateException("Başka bir interview sürüyor");
        }

        Instant now = Instant.now();
        InterviewSession session = InterviewSession.builder()
                .projectId(projectId)
                .claudeSessionId(UUID.randomUUID().toString())
                .status(InterviewStatus.RUNNING)
                .startedAt(now)
                .lastActivityAt(now)
                .build();
        session = sessionRepository.save(session);

        interviewExecutor.runStart(session.getId(), TASK_PROMPT);

        return toResponse(session);
    }

    public InterviewStatusResponse submitAnswers(String projectId, List<AnswerItem> answers) {
        findProject(projectId);
        InterviewSession session = sessionRepository.findByProjectId(projectId)
                .orElseThrow(() -> new NoSuchElementException("Bu projede aktif interview yok"));

        if (session.getStatus() != InterviewStatus.WAITING_INPUT) {
            throw new IllegalStateException("Bu interview şu an cevap beklemiyor");
        }

        String formatted = formatAnswers(session.getPendingQuestionsJson(), answers);

        session.setStatus(InterviewStatus.RUNNING);
        session.setLastActivityAt(Instant.now());
        session = sessionRepository.save(session);

        interviewExecutor.runResume(session.getId(), formatted);

        return toResponse(session);
    }

    public InterviewStatusResponse getStatus(String projectId) {
        findProject(projectId);
        InterviewSession session = sessionRepository.findByProjectId(projectId)
                .orElseThrow(() -> new NoSuchElementException("Bu projede aktif interview yok"));
        return toResponse(session);
    }

    private Project findProject(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Proje bulunamadı"));
    }

    private InterviewStatusResponse toResponse(InterviewSession session) {
        return new InterviewStatusResponse(
                session.getId(),
                session.getProjectId(),
                session.getStatus().name(),
                parseQuestions(session.getPendingQuestionsJson()),
                session.getStartedAt(),
                session.getLastActivityAt(),
                null
        );
    }

    private List<Question> parseQuestions(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Question>>() {
            });
        } catch (Exception e) {
            log.warn("pendingQuestionsJson ayristirilamadi", e);
            return List.of();
        }
    }

    private String formatAnswers(String pendingQuestionsJson, List<AnswerItem> answers) {
        Map<String, String> textById = new HashMap<>();
        for (Question question : parseQuestions(pendingQuestionsJson)) {
            textById.put(question.id(), question.text());
        }

        StringBuilder builder = new StringBuilder();
        for (AnswerItem answer : answers) {
            String questionText = textById.getOrDefault(answer.questionId(), answer.questionId());
            builder.append("Soru (").append(answer.questionId()).append("): ").append(questionText).append("\n");
            if (answer.skipped()) {
                builder.append("Cevap: (kullanıcı bu soruyu geçti, makul bir varsayımla ilerle)");
            } else {
                builder.append("Cevap: ").append(answer.answer() == null ? "" : answer.answer());
            }
            builder.append("\n\n");
        }
        builder.append("Yeterli bilgi varsa dosyaları oluştur; değilse yeni sorular sor.");
        return builder.toString();
    }
}
