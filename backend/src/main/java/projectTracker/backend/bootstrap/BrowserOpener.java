package projectTracker.backend.bootstrap;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class BrowserOpener implements ApplicationListener<ApplicationReadyEvent> {

    private final Environment environment;

    public BrowserOpener(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        boolean openBrowser = environment.getProperty(
                "projecttracker.launch.open-browser", Boolean.class, false);
        if (openBrowser) {
            BrowserLauncher.open("http://localhost:8420");
        }
    }
}
