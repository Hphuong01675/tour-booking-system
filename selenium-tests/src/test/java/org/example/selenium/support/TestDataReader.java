package org.example.selenium.support;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class TestDataReader {
    private TestDataReader() {
    }

    public static Map<String, String> readCsvRow(String filePath, String id) {
        Path path = Path.of(filePath);
        try {
            List<String> lines = Files.readAllLines(path);
            if (lines.size() < 2) {
                throw new IllegalArgumentException("CSV has no data rows: " + filePath);
            }

            String[] headers = splitCsvLine(lines.get(0));
            for (int i = 1; i < lines.size(); i++) {
                String[] values = splitCsvLine(lines.get(i));
                if (values.length > 0 && values[0].equals(id)) {
                    return toMap(headers, values);
                }
            }
            throw new IllegalArgumentException("Cannot find test data id: " + id);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static Map<String, String> toMap(String[] headers, String[] values) {
        Map<String, String> row = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            row.put(headers[i], i < values.length ? values[i] : "");
        }
        return row;
    }
    private static String[] splitCsvLine(String line) {
        java.util.List<String> result = new java.util.ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }
}
