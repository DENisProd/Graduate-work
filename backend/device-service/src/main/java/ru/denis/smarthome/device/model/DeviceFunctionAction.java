package ru.denis.smarthome.device.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.denis.smarthome.device.model.translation.DeviceFunctionActionTranslation;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "device_function_actions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"device_function_id", "code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceFunctionAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_function_id", nullable = false)
    private DeviceFunction deviceFunction;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 30)
    private ActionType actionType;

    @Column(name = "payload_template", columnDefinition = "TEXT")
    private String payloadTemplate;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "deviceFunctionAction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @MapKey(name = "locale")
    @Builder.Default
    private Map<String, DeviceFunctionActionTranslation> translations = new HashMap<>();

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
        DeviceFunctionActionTranslation translation = DeviceFunctionActionTranslation.builder()
                .locale(locale)
                .name(name)
                .description(description)
                .deviceFunctionAction(this)
                .build();
        translations.put(locale, translation);
    }

    public String getName(String locale) {
        DeviceFunctionActionTranslation translation = translations.get(locale);
        return translation != null ? translation.getName() : null;
    }

    public String getDescription(String locale) {
        DeviceFunctionActionTranslation translation = translations.get(locale);
        return translation != null ? translation.getDescription() : null;
    }
}
