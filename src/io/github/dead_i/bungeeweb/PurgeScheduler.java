package io.github.dead_i.bungeeweb;

import java.sql.ResultSet;
import java.sql.SQLException;

public class PurgeScheduler implements Runnable {
    private String table;
    private int time;
    private int min;

    public PurgeScheduler(String table, int days) {
        this.table = BungeeWeb.getConfig().getString("database.prefix") + table;
        time = days * 86400;

        try {
            ResultSet rs = BungeeWeb.getDatabase().createStatement().executeQuery("SELECT MIN(`id`) FROM `" + this.table + "`");
            if (rs.next()) min = rs.getInt(1);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void run() {
        // Chunking method courtesy of guidance from http://mysql.rjweb.org/doc.php/deletebig
        try {
            ResultSet maxquery = BungeeWeb.getDatabase().createStatement().executeQuery("SELECT `id` FROM `" + table + "` WHERE `id`>=" + min + " ORDER BY `id` LIMIT 1000,1");
            if (maxquery.next()) {
                int max = maxquery.getInt("id");
                BungeeWeb.getDatabase().createStatement().executeUpdate("DELETE FROM `" + table + "` WHERE `id`>=" + min + " AND `id`<" + max + " AND `time`<" + ((System.currentTimeMillis() / 1000) - time));
                min = max;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
