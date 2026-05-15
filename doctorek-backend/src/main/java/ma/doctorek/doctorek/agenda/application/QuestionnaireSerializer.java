package ma.doctorek.doctorek.agenda.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class QuestionnaireSerializer {

    private static final Logger log = LoggerFactory.getLogger(QuestionnaireSerializer.class);

    private final ObjectMapper objectMapper;

    public QuestionnaireSerializer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String serialize(Object questionnaire) {
        if (questionnaire == null) return null;
        try {
            return objectMapper.writeValueAsString(questionnaire);
        } catch (JsonProcessingException e) {
            log.warn("Impossible de sérialiser le questionnaire", e);
            return null;
        }
    }
}
