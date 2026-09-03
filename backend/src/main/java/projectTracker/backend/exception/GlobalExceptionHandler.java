package projectTracker.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * İstemci hatası: gövde/parametre iş kuralına uymuyor (ör. boş veya geçersiz kök yol).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    /**
     * İstemci hatası: {@code @Valid} ile işaretli istek gövdesi doğrulamayı geçemedi
     * (ör. {@code @NotBlank} ihlali). İlk alan hatasının mesajını döndürür.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fieldError -> fieldError.getDefaultMessage())
                .orElse("Geçersiz istek");
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    /**
     * Sunucu tarafı I/O hatası (ör. kök klasör tarama sırasında okunamadı).
     * İstemci isteği düzelterek çözemez, bu yüzden 500.
     */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, String>> handleIOException(IOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Dosya sistemi hatası: " + e.getMessage()));
    }

    /**
     * Son çare: beklenmeyen her hata. Ham mesaj / stack trace sızdırmadan 500 döner.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Beklenmeyen bir hata oluştu"));
    }
}
