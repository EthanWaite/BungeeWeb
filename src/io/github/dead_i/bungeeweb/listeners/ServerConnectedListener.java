package io.github.dead_i.bungeeweb.listeners;

import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.event.ServerConnectedEvent;
import net.md_5.bungee.api.plugin.Listener;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.event.EventHandler;

public class ServerConnectedListener implements Listener {
    private Plugin plugin;

    public ServerConnectedListener(Plugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onServerConnected(ServerConnectedEvent event) {
        BungeeWeb.log(plugin, event.getPlayer(), 6, event.getServer().getInfo().getName());
    }
}
