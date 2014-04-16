package io.github.dead_i.bungeeweb;

import com.google.common.io.ByteStreams;
import net.md_5.bungee.api.ProxyServer;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.config.Configuration;
import net.md_5.bungee.config.ConfigurationProvider;
import net.md_5.bungee.config.YamlConfiguration;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.util.log.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Main extends Plugin {
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
            db.createStatement().executeQuery("CREATE TABLE IF NOT EXISTS `" + getConfig().getString("database.prefix") + "log` (`id` int(16) NOT NULL AUTO_INCREMENT, `type` int(2) NOT NULL, `user` varchar(32) NOT NULL, `content` varchar(100) NOT NULL DEFAULT '', PRIMARY KEY (`id`))");
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
}
