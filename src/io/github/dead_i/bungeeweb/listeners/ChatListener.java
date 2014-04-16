package io.github.dead_i.bungeeweb.listeners;

import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.api.event.ChatEvent;
import net.md_5.bungee.api.plugin.Listener;
import net.md_5.bungee.event.EventHandler;

public class ChatListener implements Listener {
    @EventHandler
    public void onChat(ChatEvent event) {
        String msg = event.getMessage();
        ProxiedPlayer p = (ProxiedPlayer) event.getSender();
        int type = 1;
        if (msg.startsWith("/")) type = 2;
        BungeeWeb.log((ProxiedPlayer) event.getSender(), type, msg);
    }
}
