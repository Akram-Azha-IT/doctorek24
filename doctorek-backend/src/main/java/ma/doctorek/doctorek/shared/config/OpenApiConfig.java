package ma.doctorek.doctorek.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Doctorek API")
                .version("1.0.0")
                .description("Plateforme de prise de rendez-vous médicaux en ligne")
                .contact(new Contact()
                    .name("Doctorek")
                    .email("contact@doctorek.ma")));
    }
}
