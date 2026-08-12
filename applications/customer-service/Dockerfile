FROM eclipse-temurin:21-jre

LABEL maintainer="Baraza Banking Platform"

# Create a dedicated non-root user
RUN useradd -r -u 1001 -g root baraza

WORKDIR /app

COPY target/customer-service-0.0.1-SNAPSHOT.jar app.jar

# Give the application user ownership of the application directory
RUN chown -R baraza:root /app

# Run the application as a non-root user
USER 1001

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]