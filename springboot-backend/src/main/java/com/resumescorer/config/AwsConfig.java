package com.resumescorer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * Configures the AWS S3 client.
 *
 * Supports three modes:
 *   1. Local dev  — MinIO via MINIO_ENDPOINT (e.g. http://localhost:9000)
 *   2. Railway    — explicit ACCESS_KEY / SECRET_KEY pointing at real AWS
 *   3. ECS / EKS  — default credential chain (IAM role, env vars)
 */
@Configuration
public class AwsConfig {

    @Value("${app.aws.region:us-east-1}")
    private String region;

    @Value("${app.aws.access-key:}")
    private String accessKey;

    @Value("${app.aws.secret-key:}")
    private String secretKey;

    /** Optional: set to http://localhost:9000 to point at MinIO instead of AWS */
    @Value("${app.aws.endpoint:}")
    private String endpoint;

    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder()
                .region(Region.of(region));

        // Always use explicit creds if provided (MinIO or Railway)
        if (!accessKey.isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey)
            ));
        }

        // Point to MinIO (or any custom S3-compatible endpoint)
        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint))
                   .serviceConfiguration(S3Configuration.builder()
                           .pathStyleAccessEnabled(true)  // MinIO requires path-style
                           .build());
        }

        return builder.build();
    }
}
