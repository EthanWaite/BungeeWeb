package io.github.dead_i.bungeeweb.commands;

import io.github.dead_i.bungeeweb.BungeeWeb;
import net.md_5.bungee.api.ChatColor;
import net.md_5.bungee.api.CommandSender;
import net.md_5.bungee.api.chat.ComponentBuilder;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.api.plugin.Command;
import net.md_5.bungee.api.plugin.Plugin;

public class ReloadConfig extends Command {
    private Plugin plugin;

    public ReloadConfig(Plugin plugin) {
        super("bwreload", "bungeeweb.reload");
        this.plugin = plugin;
    }

    @Override
    public void execute(CommandSender sender, String[] strings) {
        BungeeWeb.reloadConfig(plugin);
        sender.sendMessage(new ComponentBuilder("The BungeeWeb configuration has been reloaded. Please note that certain changes may require a proxy restart to take effect.").color(ChatColor.RED).create());
    }
}
