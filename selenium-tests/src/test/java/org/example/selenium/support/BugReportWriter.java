package org.example.selenium.support;

import org.testng.ITestResult;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public final class BugReportWriter {
    private static final Path BUG_REPORT_PATH = Path.of("target", "reports", "bug_report.csv");
    private static final String HEADER = "test_class,test_method,status,error,screenshot" + System.lineSeparator();

    private BugReportWriter() {
    }

    public static synchronized void reset() {
        try {
            Files.createDirectories(BUG_REPORT_PATH.getParent());
            Files.writeString(BUG_REPORT_PATH, HEADER, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            System.err.println("Could not reset bug report: " + e.getMessage());
        }
    }

    public static synchronized void appendResult(ITestResult result, String status) {
        appendResult(result, status, null);
    }

    public static synchronized void appendResult(ITestResult result, String status, Path screenshotPath) {
        try {
            Files.createDirectories(BUG_REPORT_PATH.getParent());
            if (Files.notExists(BUG_REPORT_PATH)) {
                Files.writeString(BUG_REPORT_PATH, HEADER, StandardOpenOption.CREATE);
            }

            String error = result.getThrowable() == null ? "" : result.getThrowable().toString();
            String line = csv(result.getTestClass().getRealClass().getSimpleName())
                    + "," + csv(result.getMethod().getMethodName())
                    + "," + csv(status)
                    + ","
                    + csv(error)
                    + "," + csv(screenshotPath == null ? "" : screenshotPath.toAbsolutePath().toString())
                    + System.lineSeparator();
            Files.writeString(BUG_REPORT_PATH, line, StandardOpenOption.APPEND);
        } catch (IOException e) {
            System.err.println("Could not write bug report: " + e.getMessage());
        }
    }

    private static String csv(String value) {
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
