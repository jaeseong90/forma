package com.forma.frame.screen;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.forma.frame.screen.model.ScreenDefinition;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class ScreenRegistry {

    private final Map<String, ScreenDefinition> screens = new ConcurrentHashMap<>();
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    @PostConstruct
    public void loadScreens() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:design/screens/*.yml");

            for (Resource resource : resources) {
                try (InputStream is = resource.getInputStream()) {
                    ScreenDefinition def = yamlMapper.readValue(is, ScreenDefinition.class);
                    if (def.getScreen() != null && def.getScreen().getId() != null) {
                        screens.put(def.getScreen().getId(), def);
                        log.info("Screen registered: {} ({})", def.getScreen().getId(), def.getScreen().getName());
                    }
                } catch (Exception e) {
                    log.warn("Failed to load screen YAML: {} - {}", resource.getFilename(), e.getMessage());
                }
            }
            log.info("Screen registry loaded: {} screens", screens.size());
        } catch (Exception e) {
            log.warn("No screen YAML files found: {}", e.getMessage());
        }
    }

    public ScreenDefinition getDefinition(String screenId) {
        return screens.get(screenId);
    }

    public boolean hasDefinition(String screenId) {
        return screens.containsKey(screenId);
    }

    /**
     * 개발 모드: YAML 재로딩
     */
    public int reload() {
        screens.clear();
        loadScreens();
        return screens.size();
    }
}
