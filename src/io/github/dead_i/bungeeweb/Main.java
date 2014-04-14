package io.github.dead_i.bungeeweb;

import net.md_5.bungee.api.plugin.Plugin;
import org.eclipse.jetty.server.Server;

public class Main extends Plugin {
    public static Server server;

    public void onEnable() {
        // Setup the server
        server = new Server(8080);
        server.setHandler(new WebHandler(this));

        // Start listening
        try {
            server.start();
            server.join();
        } catch(Exception e) {
            getLogger().warning("Unable to bind web server to port.");
            e.printStackTrace();
        }
    }
}
