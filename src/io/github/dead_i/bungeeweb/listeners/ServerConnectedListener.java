package io.github.dead_i.bungeeweb.listeners;

import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.event.ServerConnectedEvent;
import net.md_5.bungee.api.plugin.Listener;
import net.md_5.bungee.event.EventHandler;

public class ServerConnectedListener implements Listener {
    @EventHandler
    public void onServerConnected(ServerConnectedEvent event) {
        BungeeWeb.log(event.getPlayer(), 6, event.getServer().getInfo().getName());
    }
}
