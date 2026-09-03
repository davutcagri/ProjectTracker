package projectTracker.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import projectTracker.backend.dto.request.RootPathRequest;
import projectTracker.backend.dto.response.RootPathResponse;
import projectTracker.backend.service.RootService;

@RestController
@RequestMapping("/api/settings")
public class RootController {

    private final RootService rootService;

    public RootController(RootService rootService) {
        this.rootService = rootService;
    }

    @GetMapping
    public RootPathResponse getRootPath() {
        return new RootPathResponse(rootService.getRootPath());
    }

    @PutMapping
    public ResponseEntity<RootPathResponse> setRootPath(@RequestBody @Valid RootPathRequest body) {
        rootService.setRootPath(body.rootPath());
        return ResponseEntity.ok(new RootPathResponse(rootService.getRootPath()));
    }
}
