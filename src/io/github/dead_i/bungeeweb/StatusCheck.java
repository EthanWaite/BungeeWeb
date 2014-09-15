package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.config.Configuration;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

public class StatusCheck implements Runnable {
    private Plugin plugin;
    private int inc;

    public StatusCheck(Plugin plugin, int inc) {
        this.plugin = plugin;
        this.inc = inc;
    }

    @Override
    public void run() {
        int cur = (int) (System.currentTimeMillis() / 1000);
        Configuration config = BungeeWeb.getConfig();
        ArrayList<String> conditions = new ArrayList<String>();
        ArrayList<Object> params = new ArrayList<Object>();

        int players = 0;
        if (config.getBoolean("stats.playercount")) {
            players = plugin.getProxy().getPlayers().size();
            conditions.add("playercount");
            params.add(players);
        }

        try {
            Connection db = BungeeWeb.getDatabase();

            if (config.getBoolean("stats.activity")) {
                ResultSet activity = db.createStatement().executeQuery("SELECT COUNT(*) FROM `" + config.getString("database.prefix") + "log` WHERE `time`>" + (cur - inc));
                activity.next();
                conditions.add("activity");
                params.add(activity.getInt(1));
            }

            if (config.getBoolean("stats.playercount") && config.getBoolean("stats.maxplayers")) {
                ResultSet maxplayers = db.createStatement().executeQuery("SELECT * FROM `" + config.getString("database.prefix") + "stats` ORDER BY `playercount` DESC LIMIT 1");
                conditions.add("maxplayers");
                if (maxplayers.next()) {
                    int max = maxplayers.getInt("playercount");
                    if (players > max) {
                        params.add(plugin.getProxy().getConfig().getPlayerLimit());
                    }else{
                        params.add(max);
                    }
                }else{
                    params.add(players);
                }
            }

            if (conditions.size() == 0) return;

            String keys = "`time`, ";
            String values = cur + ", ";
            for (String c : conditions) {
                keys += "`" + c + "`, ";
                values += "?, ";
            }
            keys = keys.substring(0, keys.length() - 2);
            values = values.substring(0, values.length() - 2);

            PreparedStatement st = db.prepareStatement("INSERT INTO `" + config.getString("database.prefix") + "stats` (" + keys + ") VALUES(" + values + ")");

            int i = 0;
            for (Object p : params) {
                i++;
                st.setObject(i, p);
            }

            st.executeUpdate();
        } catch (SQLException e) {
            plugin.getLogger().warning("An error occurred when executing the database query to update the statistics.");
        }
    }
}
