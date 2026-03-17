package com.forma.common.util;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class SeqGenerator {

    private final JdbcTemplate jdbc;

    public SeqGenerator(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS forma_seq (
                prefix VARCHAR(20) NOT NULL,
                date_part VARCHAR(8) NOT NULL,
                last_seq INT NOT NULL DEFAULT 0,
                PRIMARY KEY (prefix, date_part)
            )
        """);
    }

    /** PREFIX-yyyyMMdd-001 형태의 채번 */
    public String next(String prefix) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        int updated = jdbc.update(
                "UPDATE forma_seq SET last_seq = last_seq + 1 WHERE prefix = ? AND date_part = ?",
                prefix, datePart);

        if (updated == 0) {
            jdbc.update("INSERT INTO forma_seq (prefix, date_part, last_seq) VALUES (?, ?, 1)",
                    prefix, datePart);
        }

        Integer seq = jdbc.queryForObject(
                "SELECT last_seq FROM forma_seq WHERE prefix = ? AND date_part = ?",
                Integer.class, prefix, datePart);

        return prefix + "-" + datePart + "-" + String.format("%03d", seq);
    }
}
