package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class DatabaseManager {
    private List<Connection> connections = new ArrayList<Connection>();
    private Plugin plugin;
    private String dsn;
    private String user;
    private String pass;

    public DatabaseManager(Plugin plugin, String dsn, String user, String pass) {
        this.plugin = plugin;
        this.dsn = dsn;
        this.user = user;
        this.pass = pass;
    }

    public synchronized Connection getConnection() {
        for (Connection c : connections) {
            try {
                if (c.isValid(2) && !c.isClosed()) {
                    return c;
                }else{
                    connections.remove(c);
                }
            } catch(SQLException e) {
                e.printStackTrace();
                connections.remove(c);
            }
        }

        Connection c = runConnection();
        if (c != null) connections.add(c);
        return c;
    }

    private Connection runConnection() {
        try {
            return DriverManager.getConnection(dsn, user, pass);
        } catch(SQLException e) {
            plugin.getLogger().severe("Unable to connect to MySQL database. BungeeWeb may not function properly.");
            return null;
        }
    }
}
