package projectTracker.backend.dto.internal;

public record Milestone(String name, Integer totalTasks, Integer completedTasks, String status, Integer progress) {

    public Milestone(String name, Integer totalTasks, Integer completedTasks) {
        this(name, totalTasks, completedTasks, status(totalTasks, completedTasks), progress(totalTasks, completedTasks));
    }

    public static String status(Integer totalTasks, Integer completedTasks) {
        if (totalTasks == null || completedTasks == null || totalTasks == 0) {
            return "Empty";
        } else if (completedTasks.equals(totalTasks)) {
            return "Completed";
        } else if (completedTasks == 0) {
            return "Not Started";
        } else {
            return "In Progress";
        }
    }

    public static Integer progress(Integer totalTasks, Integer completedTasks) {
        if (totalTasks == null || completedTasks == null || totalTasks == 0) {
            return 0;
        }
        return (int) (completedTasks * 100.0 / totalTasks);
    }

}
