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

public class Main extends Plugin {
    private static Server server;
    private static Configuration config;

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

        // Setup the server
        server = new Server(8080);
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
}
