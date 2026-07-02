package org.example.selenium.support;

import org.testng.ITestResult;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;

public final class AutomationLogger {
    private static final Path LOG_PATH = Path.of("target", "logs", "automation.log");

    private AutomationLogger() {
    }

    public static synchronized void reset() {
        try {
            Files.createDirectories(LOG_PATH.getParent());
            Files.writeString(LOG_PATH, "", StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            System.err.println("Could not reset automation log: " + e.getMessage());
        }
    }

    public static void info(String message) {
        write("INFO", message);
    }

    public static void testResult(String status, ITestResult result) {
        String testName = result.getTestClass().getRealClass().getSimpleName()
                + "." + result.getMethod().getMethodName();
        write(status, testName);
    }

    private static synchronized void write(String level, String message) {
        try {
            Files.createDirectories(LOG_PATH.getParent());
            String line = LocalDateTime.now() + " [" + level + "] " + message + System.lineSeparator();
            Files.writeString(LOG_PATH, line, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            System.err.println("Could not write automation log: " + e.getMessage());
        }
    }
}
