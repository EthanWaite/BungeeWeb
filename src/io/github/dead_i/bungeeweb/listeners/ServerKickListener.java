package io.github.dead_i.bungeeweb.listeners;

import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.chat.BaseComponent;
import net.md_5.bungee.api.event.ServerKickEvent;
import net.md_5.bungee.api.plugin.Listener;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.event.EventHandler;

public class ServerKickListener implements Listener {
    private Plugin plugin;

    public ServerKickListener(Plugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onServerKick(ServerKickEvent event) {
        if (event.getPlayer() != null && event.getPlayer().getServer() != null) {
            BungeeWeb.log(plugin, event.getPlayer(), 5, event.getPlayer().getServer().getInfo().getName() + ": " + BaseComponent.toPlainText(event.getKickReasonComponent()));
        }
    }
}
