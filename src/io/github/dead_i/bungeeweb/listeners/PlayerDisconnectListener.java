package io.github.dead_i.bungeeweb.listeners;

import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.event.PlayerDisconnectEvent;
import net.md_5.bungee.api.plugin.Listener;
import net.md_5.bungee.event.EventHandler;

public class PlayerDisconnectListener implements Listener {
    @EventHandler
    public void onPlayerDisconnect(PlayerDisconnectEvent event) {
        BungeeWeb.log(event.getPlayer(), 4);
    }
}
