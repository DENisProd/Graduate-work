package ru.denis.smarthome.device.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.denis.smarthome.device.model.translation.DeviceTypeTranslation;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "device_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "deviceType", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @MapKey(name = "locale")
    @Builder.Default
    private Map<String, DeviceTypeTranslation> translations = new HashMap<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addTranslation(String locale, String name, String description) {
        DeviceTypeTranslation translation = DeviceTypeTranslation.builder()
                .locale(locale)
                .name(name)
                .description(description)
                .deviceType(this)
                .build();
        translations.put(locale, translation);
    }

    public String getName(String locale) {
        DeviceTypeTranslation translation = translations.get(locale);
        return translation != null ? translation.getName() : null;
    }

    public String getDescription(String locale) {
        DeviceTypeTranslation translation = translations.get(locale);
        return translation != null ? translation.getDescription() : null;
    }
}
