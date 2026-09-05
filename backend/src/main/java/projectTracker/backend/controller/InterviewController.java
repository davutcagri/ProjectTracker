package projectTracker.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projectTracker.backend.dto.request.AnswerItem;
import projectTracker.backend.dto.response.InterviewStatusResponse;
import projectTracker.backend.service.InterviewService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/projects/{id}/interview")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/start")
    public ResponseEntity<InterviewStatusResponse> start(@PathVariable String id) throws IOException {
        return ResponseEntity.accepted().body(interviewService.start(id));
    }

    @PostMapping("/answers")
    public ResponseEntity<InterviewStatusResponse> answers(@PathVariable String id,
                                                           @RequestBody @Valid List<AnswerItem> answers) {
        return ResponseEntity.accepted().body(interviewService.submitAnswers(id, answers));
    }

    @GetMapping
    public ResponseEntity<InterviewStatusResponse> status(@PathVariable String id) {
        return ResponseEntity.ok(interviewService.getStatus(id));
    }
}
