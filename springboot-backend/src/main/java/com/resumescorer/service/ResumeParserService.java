package com.resumescorer.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Extracts plain text from uploaded resume files.
 * Supported formats: PDF, DOCX, DOC, TXT
 */
@Slf4j
@Service
public class ResumeParserService {

    private static final int MAX_TEXT_LENGTH = 10_000;

    /**
     * Extract plain text from the uploaded resume file.
     *
     * @param file Multipart file uploaded by the user
     * @return     Extracted plain text, truncated to MAX_TEXT_LENGTH characters
     * @throws IllegalArgumentException if the file type is unsupported or text is empty
     */
    public String extractText(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase()
                : "";

        try {
            String text;
            if (isPdf(contentType, filename)) {
                text = extractFromPdf(file);
            } else if (isDocx(contentType, filename)) {
                text = extractFromDocx(file);
            } else if (isTxt(contentType, filename)) {
                text = extractFromTxt(file);
            } else {
                throw new IllegalArgumentException(
                    "Unsupported file type: " + contentType + ". Please upload PDF, DOCX, or TXT."
                );
            }

            String trimmed = text.trim();
            if (trimmed.length() < 50) {
                throw new IllegalArgumentException(
                    "Resume appears to be empty or could not be read. " +
                    "If it's a scanned PDF, please convert it to text first."
                );
            }

            // Truncate to avoid excessive token usage
            if (trimmed.length() > MAX_TEXT_LENGTH) {
                log.debug("Resume text truncated from {} to {} chars", trimmed.length(), MAX_TEXT_LENGTH);
                return trimmed.substring(0, MAX_TEXT_LENGTH);
            }
            return trimmed;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract text from resume", e);
            throw new RuntimeException("Could not read resume file: " + e.getMessage(), e);
        }
    }

    // ── Private extraction methods ────────────────────────

    private String extractFromPdf(MultipartFile file) throws IOException {
        try (RandomAccessReadBuffer buf = new RandomAccessReadBuffer(file.getInputStream());
             PDDocument doc = Loader.loadPDF(buf)) {
            if (doc.isEncrypted()) {
                throw new IllegalArgumentException("PDF is password-protected. Please upload an unprotected file.");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(doc);
        }
    }

    private String extractFromDocx(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream();
             XWPFDocument doc = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    private String extractFromTxt(MultipartFile file) throws IOException {
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    // ── Type detection ───────────────────────────────────

    private boolean isPdf(String ct, String name) {
        return "application/pdf".equals(ct) || name.endsWith(".pdf");
    }

    private boolean isDocx(String ct, String name) {
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(ct)
                || "application/msword".equals(ct)
                || name.endsWith(".docx")
                || name.endsWith(".doc");
    }

    private boolean isTxt(String ct, String name) {
        return ct != null && ct.startsWith("text/") || name.endsWith(".txt");
    }
}
