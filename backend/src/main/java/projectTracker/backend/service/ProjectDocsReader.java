package projectTracker.backend.service;

import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.ProjectDocs;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProjectDocsReader {

    public List<ProjectDocs> readInnerFiles(Path projectPath) throws IOException {
        String[] names = {"README.md", "SCOPE.md", "ROADMAP.md"};
        List<ProjectDocs> docs = new ArrayList<>();
        for (String name : names) {
            Path path = projectPath.resolve(name);
            String content = Files.isRegularFile(path) ? Files.readString(path) : null;
            docs.add(new ProjectDocs(name, content));
        }
        return docs;
    }
}
