package projectTracker.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * SPA (React Router) fallback yapilandirmasi.
 *
 * <p>React Router client-side routing yapar: tarayicida gezinirken sunucuya hic
 * gidilmez. Ama kullanici adres cubuguna elle "/settings" yazip Enter'a basarsa
 * ya da o sayfadayken F5 yaparsa, tarayici gercekten "GET /settings" isteği
 * gonderir. Spring'de boyle bir yol olmadigi icin 404 doner ve beyaz ekran
 * olusur.
 *
 * <p>Bu sinif, statik dosya servis eden zincire ozel bir cozucu takar:
 * <ol>
 *   <li>Istenen yolda gercek bir dosya varsa (ornek: assets/index-*.js,
 *       favicon.ico) onu servis eder.</li>
 *   <li>Yol backend'e ait bir on ek ile basliyorsa (api/, h2-console/,
 *       swagger-ui/, v3/api-docs) null doner; boylece Spring duzgun bir 404
 *       uretir, SPA HTML'i sizmaz.</li>
 *   <li>Geri kalan her sey React uygulamasinin bir rotasi kabul edilir ve
 *       index.html dondurulur; index.html yuklenince React Router dogru sayfayi
 *       cizer.</li>
 * </ol>
 *
 * <p>Not: Bu fallback yalnizca paketlenmis jar calisirken (:8420) onemlidir.
 * Gelistirmede Vite dev server (:5173) kendi fallback'ini yapar.
 */
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
