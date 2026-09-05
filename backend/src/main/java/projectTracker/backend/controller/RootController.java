package projectTracker.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projectTracker.backend.dto.request.RootPathRequest;
import projectTracker.backend.dto.response.RootPathResponse;
import projectTracker.backend.service.AppSettingsService;

@RestController
@RequestMapping("/api/settings")
public class RootController {

    private final AppSettingsService appSettingsService;

    public RootController(AppSettingsService appSettingsService) {
        this.appSettingsService = appSettingsService;
    }

    @GetMapping
    public RootPathResponse getRootPath() {
        return new RootPathResponse(appSettingsService.getRootPath());
    }

    @PutMapping
    public ResponseEntity<RootPathResponse> setRootPath(@RequestBody @Valid RootPathRequest body) {
        appSettingsService.setRootPath(body.rootPath());
        return ResponseEntity.ok(new RootPathResponse(appSettingsService.getRootPath()));
    }
}
