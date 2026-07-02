package org.example.selenium.listeners;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;
import org.example.selenium.base.BaseTest;
import org.example.selenium.config.TestConfig;
import org.example.selenium.support.AutomationLogger;
import org.example.selenium.support.BugReportWriter;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;
import org.testng.Reporter;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public class ExtentReportListener implements ITestListener {
    private static final Path REPORT_PATH = Path.of("target", "extent-report", "ExtentReport.html");
    private static final ThreadLocal<ExtentTest> TEST = new ThreadLocal<>();
    private static ExtentReports extentReports;

    @Override
    public void onStart(ITestContext context) {
        AutomationLogger.reset();
        BugReportWriter.reset();

        ExtentSparkReporter sparkReporter = new ExtentSparkReporter(REPORT_PATH.toString());
        sparkReporter.config().setDocumentTitle("Selenium Test Report");
        sparkReporter.config().setReportName("Selenium Automation Demo");
        sparkReporter.config().setTheme(Theme.STANDARD);

        extentReports = new ExtentReports();
        extentReports.attachReporter(sparkReporter);
        extentReports.setSystemInfo("Project", "Selenium Demo");
        extentReports.setSystemInfo("Framework", "Selenium + TestNG");
        extentReports.setSystemInfo("Base URL", TestConfig.baseUrl());
        extentReports.setSystemInfo("Browser", TestConfig.browser());
        extentReports.setSystemInfo("Headless", String.valueOf(TestConfig.headless()));
        AutomationLogger.info("Test suite started: " + context.getName());
    }

    @Override
    public void onTestStart(ITestResult result) {
        ExtentTest test = extentReports.createTest(result.getMethod().getMethodName());
        test.assignCategory(result.getTestClass().getRealClass().getSimpleName());
        test.log(Status.INFO, "Test started");
        AutomationLogger.testResult("START", result);
        TEST.set(test);
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        logReporterOutput(result);
        TEST.get().pass("Test passed");
        AutomationLogger.testResult("PASS", result);
        BugReportWriter.appendResult(result, "PASS");
    }

    @Override
    public void onTestFailure(ITestResult result) {
        ExtentTest test = TEST.get();
        logReporterOutput(result);
        test.fail(result.getThrowable());
        AutomationLogger.testResult("FAIL", result);

        try {
            Path screenshotPath = BaseTest.captureScreenshot(result);
            String absolutePath = screenshotPath.toAbsolutePath().toString();
            test.addScreenCaptureFromPath(absolutePath);
            BugReportWriter.appendResult(result, "FAIL", screenshotPath);
            Reporter.log("Failure screenshot saved: " + absolutePath, true);
        } catch (IOException | RuntimeException e) {
            BugReportWriter.appendResult(result, "FAIL");
            test.warning("Could not capture failure screenshot: " + e.getMessage());
        }
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        logReporterOutput(result);
        TEST.get().skip(result.getThrowable());
        AutomationLogger.testResult("SKIP", result);
        BugReportWriter.appendResult(result, "SKIP");
    }

    @Override
    public void onFinish(ITestContext context) {
        if (extentReports != null) {
            extentReports.flush();
            Reporter.log("Extent report saved: " + REPORT_PATH.toAbsolutePath(), true);
        }
        AutomationLogger.info("Test suite finished: " + context.getName());
        TEST.remove();
    }

    private void logReporterOutput(ITestResult result) {
        List<String> outputLines = Reporter.getOutput(result);
        for (String outputLine : outputLines) {
            TEST.get().info(outputLine);
        }
    }
}
