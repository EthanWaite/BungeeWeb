package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Database {
    private Plugin plugin;
    private Connection con;

    public Database(Plugin plugin) {
        this.plugin = plugin;
    }

    public void connect(String host, int port, String user, String pass, String db) {
        try {
            con = DriverManager.getConnection("jdbc:mysql://" + host + ":" + port + "/" + db, user, pass);
        } catch (SQLException e) {
            plugin.getLogger().severe("Unable to connect to the database.");
            e.printStackTrace();
        }
    }
}
