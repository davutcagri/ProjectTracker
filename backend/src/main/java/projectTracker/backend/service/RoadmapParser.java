package projectTracker.backend.service;

import org.springframework.stereotype.Service;
import projectTracker.backend.dto.internal.Milestone;

import java.util.ArrayList;
import java.util.List;

@Service
public class RoadmapParser {

    public List<Milestone> extractMilestones(String roadmapContent) {
        List<Milestone> milestones = new ArrayList<>();

        if (roadmapContent == null) {
            return milestones;
        }

        String currentMilestone = null;
        int totalTask = 0;
        int completedTask = 0;

        for (String line : roadmapContent.lines().toList()) {
            if (line.startsWith("## ")) {
                if (currentMilestone != null) {
                    milestones.add(new Milestone(currentMilestone, totalTask, completedTask));
                    totalTask = 0;
                    completedTask = 0;
                }
                currentMilestone = line.substring(3);
            } else if (currentMilestone != null && (line.startsWith("- [x] ") || line.startsWith("- [X] "))) {
                totalTask++;
                completedTask++;
            } else if (currentMilestone != null && line.startsWith("- [ ] ")) {
                totalTask++;
            }
        }

        if (currentMilestone != null) {
            milestones.add(new Milestone(currentMilestone, totalTask, completedTask));
        }

        return milestones;
    }

    public Integer calculateProgress(String roadmapContent) {
        List<Milestone> milestones = extractMilestones(roadmapContent);

        int total = milestones.stream().mapToInt(Milestone::totalTasks).sum();
        int completed = milestones.stream().mapToInt(Milestone::completedTasks).sum();

        if (total == 0) {
            return 0;
        }

        return (int) (completed * 100.0 / total);
    }
}
