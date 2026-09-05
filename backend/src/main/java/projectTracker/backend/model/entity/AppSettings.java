package projectTracker.backend.model.entity;

import jakarta.persistence.Entity;

import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class AppSettings {

    @Id
    private Integer id;
    private String rootPath;

}
