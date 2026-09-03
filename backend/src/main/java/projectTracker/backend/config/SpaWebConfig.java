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

    /** Fallback disinda tutulan, backend'e ait yol on ekleri. */
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

                        // 1) Gercek dosya varsa (assets/..., favicon.ico) onu ver
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }

                        // 2) Backend yollari SPA'ya dusmesin -> null = 404
                        for (String prefix : BACKEND_PATH_PREFIXES) {
                            if (resourcePath.startsWith(prefix)) {
                                return null;
                            }
                        }

                        // 3) Kalan her sey React Router'in bir rotasidir
                        return new ClassPathResource("static/index.html");
                    }
                });
    }
}
