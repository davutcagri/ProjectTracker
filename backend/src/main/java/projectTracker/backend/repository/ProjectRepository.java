package projectTracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import projectTracker.backend.model.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {
    Project findByPath(String path);
}
