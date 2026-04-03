package ru.denis.smarthome.device.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.denis.smarthome.device.model.translation.DeviceCategoryTranslation;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "device_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_type_id", nullable = false)
    private DeviceType deviceType;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "deviceCategory", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @MapKey(name = "locale")
    @Builder.Default
    private Map<String, DeviceCategoryTranslation> translations = new HashMap<>();

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
        DeviceCategoryTranslation translation = DeviceCategoryTranslation.builder()
                .locale(locale)
                .name(name)
                .description(description)
                .deviceCategory(this)
                .build();
        translations.put(locale, translation);
    }

    public String getName(String locale) {
        DeviceCategoryTranslation translation = translations.get(locale);
        return translation != null ? translation.getName() : null;
    }

    public String getDescription(String locale) {
        DeviceCategoryTranslation translation = translations.get(locale);
        return translation != null ? translation.getDescription() : null;
    }
}
