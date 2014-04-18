package io.github.dead_i.bungeeweb;

import com.google.common.io.ByteStreams;
import io.github.dead_i.bungeeweb.listeners.*;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.config.Configuration;
import net.md_5.bungee.config.ConfigurationProvider;
import net.md_5.bungee.config.YamlConfiguration;
import org.eclipse.jetty.server.Server;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class BungeeWeb extends Plugin {
    private static Server server;
    private static Configuration config;
    private static Connection db;

    public void onEnable() {
        // Get configuration
        if (!getDataFolder().exists()) getDataFolder().mkdir();
        File configFile = new File(getDataFolder(), "config.yml");
        try {
            if (!configFile.exists()) {
                configFile.createNewFile();
                ByteStreams.copy(getResourceAsStream("config.yml"), new FileOutputStream(configFile));
                getLogger().warning("A new configuration file has been created. Please edit config.yml and restart BungeeCord.");
                return;
            }
            config = ConfigurationProvider.getProvider(YamlConfiguration.class).load(configFile);
        } catch (IOException e) {
            e.printStackTrace();
        }

        // Connect to the database and create tables
        try {
            db = DriverManager.getConnection("jdbc:mysql://" + config.getString("database.host") + ":" + config.getInt("database.port") + "/" + config.getString("database.db"), config.getString("database.user"), config.getString("database.pass"));

            db.createStatement().executeUpdate("CREATE TABLE IF NOT EXISTS `" + config.getString("database.prefix") + "log` (`id` int(16) NOT NULL AUTO_INCREMENT, `time` int(10) NOT NULL, `type` int(2) NOT NULL, `uuid` varchar(32) NOT NULL, `username` varchar(16) NOT NULL, `content` varchar(100) NOT NULL DEFAULT '', PRIMARY KEY (`id`))");
            db.createStatement().executeUpdate("CREATE TABLE IF NOT EXISTS `" + config.getString("database.prefix") + "users` (`id` int(4) NOT NULL AUTO_INCREMENT, `user` varchar(16) NOT NULL, `pass` varchar(32) NOT NULL, `salt` varchar(8) NOT NULL, `group` int(1) NOT NULL DEFAULT '1', PRIMARY KEY (`id`))");

            ResultSet rs = db.createStatement().executeQuery("SELECT COUNT(*) FROM `" + config.getString("database.prefix") + "users`");
            while (rs.next()) {
                if (rs.getInt(1) == 0) {
                    //TODO
                }
            }
        } catch (SQLException e) {
            getLogger().severe("Unable to connect to the database.");
            e.printStackTrace();
        }
        // Setup the server
        server = new Server(config.getInt("server.port"));
        server.setHandler(new WebHandler(this));
        server.setStopAtShutdown(true);

        // Start listening
        try {
            server.start();
            server.join();
        } catch(Exception e) {
            getLogger().warning("Unable to bind web server to port.");
            e.printStackTrace();
        }

        // Register listeners
        getProxy().getPluginManager().registerListener(this, new ChatListener());
        getProxy().getPluginManager().registerListener(this, new PlayerDisconnectListener());
        getProxy().getPluginManager().registerListener(this, new PostLoginListener());
        getProxy().getPluginManager().registerListener(this, new ServerConnectedListener());
        getProxy().getPluginManager().registerListener(this, new ServerKickListener());
    }

    public static Server getServer() {
        return server;
    }

    public static Configuration getConfig() {
        return config;
    }

    public static Connection getDatabase() {
        return db;
    }

    public static void log(ProxiedPlayer player, int type) {
        log(player, type, "");
    }

    public static void log(ProxiedPlayer player, int type, String content) {
        try {
            PreparedStatement st = db.prepareStatement("INSERT INTO `" + config.getString("database.prefix") + "log` (`time`, `type`, `uuid`, `username`, `content`) VALUES(?, ?, ?, ?, ?)");
            st.setLong(1, System.currentTimeMillis() / 1000);
            st.setInt(2, type);
            st.setString(3, player.getUniqueId().toString());
            st.setString(4, player.getName());
            st.setString(5, content);
            st.executeUpdate();
            st.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
