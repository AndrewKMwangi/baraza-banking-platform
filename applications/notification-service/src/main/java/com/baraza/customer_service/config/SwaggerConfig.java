package com.baraza.customer_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customerServiceAPI() {

        return new OpenAPI()
                .info(new Info()
                        .title("Baraza Banking Customer Service API")
                        .description("REST API for managing customers in the Baraza Banking Platform")
                        .version("1.0")
                        .contact(new Contact()
                                .name("Baraza Engineering Team")
                                .email("engineering@baraza.com")));
    }
}