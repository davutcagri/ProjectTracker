package projectTracker.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    private static final String[] BACKEND_PATH_PREFIXES = {
            "api/",
            "h2-console/",
            "swagger-ui/",
            "v3/api-docs"
    };

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location)
                            throws IOException {

                        Resource requested = location.createRelative(resourcePath);

                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }

                        for (String prefix : BACKEND_PATH_PREFIXES) {
                            if (resourcePath.startsWith(prefix)) {
                                return null;
                            }
                        }

                        return new ClassPathResource("static/index.html");
                    }
                });
    }
}
