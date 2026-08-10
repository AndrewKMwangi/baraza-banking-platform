FROM eclipse-temurin:21-jre

LABEL maintainer="Baraza Banking Platform"

WORKDIR /app

COPY target/customer-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]