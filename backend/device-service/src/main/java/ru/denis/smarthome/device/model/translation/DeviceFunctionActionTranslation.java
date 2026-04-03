package ru.denis.smarthome.device.model.translation;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.denis.smarthome.device.model.DeviceFunctionAction;

@Entity
@Table(name = "device_function_action_translations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"device_function_action_id", "locale"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceFunctionActionTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String locale;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_function_action_id", nullable = false)
    private DeviceFunctionAction deviceFunctionAction;
}



