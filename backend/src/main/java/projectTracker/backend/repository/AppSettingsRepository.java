package projectTracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import projectTracker.backend.model.AppSettings;

@Repository
public interface AppSettingsRepository extends JpaRepository<AppSettings, Integer> {
}
