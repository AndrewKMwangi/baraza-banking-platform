FROM eclipse-temurin:21-jre

LABEL maintainer="Baraza Banking Platform"

# Create a dedicated non-root user
RUN useradd -r -u 1001 -g root baraza

WORKDIR /app

# Copy the application and assign ownership in the same layer
COPY --chown=1001:0 target/customer-service-0.0.1-SNAPSHOT.jar app.jar

# Run the application as a non-root user
USER 1001

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
