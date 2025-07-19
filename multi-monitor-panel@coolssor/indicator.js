/*
Copyright (C) 2014  spin83

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, visit https://www.gnu.org/licenses/.
*/

/* Modified by coolssor */

// Import necessary GNOME Shell libraries and modules
import St from 'gi://St'; // Provides UI elements like labels, icons, and containers
import Gio from 'gi://Gio'; // Used for interacting with the file system and D-Bus
import GLib from 'gi://GLib'; // Provides utility functions like working with variants
import GObject from 'gi://GObject'; // Base class for creating GNOME objects

// Import GNOME Shell-specific modules
import * as Main from 'resource:///org/gnome/shell/ui/main.js'; // Main GNOME Shell UI components
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'; // Provides utilities for creating panel menus
import { extensionInstance } from './extension.js'; // Reference to the extension instance

// Import gettext for localization
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

// Define the MultiMonitorIndicator class
// Define the MultiMonitorIndicator class as a subclass of PanelMenu.Button
export class MultiMonitorIndicator extends PanelMenu.Button {
    constructor(settings) {
        // Call the parent class constructor
        super(0.0, "MultiMonitorPanelExtension", false);

        // Store the settings object
        this._settings = settings;

        // Initialize properties
        this.text = null;

        // Create a container for status icons and hide it initially
        this._mmStatusIcon = new St.BoxLayout({ style_class: 'multimonitor-status-indicators-box' });
        this._mmStatusIcon.hide();
        this.add_child(this._mmStatusIcon);

        // Track whether the icon is displayed on the left or right
        this._leftRightIcon = true;

        // Add a title to the menu
        const title = new St.Label({
            text: _("Multi-monitor panel"), // Localized title
            style_class: 'multimonitor-menu-title'
        });
        this.menu.box.add_child(title);

        // Add a "Preferences" action to the menu
        this.menu.addAction(_("Preferences"), this._onPreferences.bind(this));

        // Connect to the 'monitors-changed' signal to update the UI when monitors change
        this._viewMonitorsId = Main.layoutManager.connect('monitors-changed', this._viewMonitors.bind(this));

        // Initialize the monitor view
        this._viewMonitors();
    }

    // Cleanup method called when the object is destroyed
    _onDestroy() {
        // Disconnect the 'monitors-changed' signal
        Main.layoutManager.disconnect(this._viewMonitorsId);
        super._onDestroy(); // Call the parent class's destroy method
    }

    // Update the visibility of the status indicators
    _syncIndicatorsVisible() {
        // Set visibility based on whether any child icons are visible
        this._mmStatusIcon.visible = this._mmStatusIcon.get_children().some(a => a.visible);
    }

    // Helper method to set the icon name
    _icon_name(icon, iconName) {
        // Set the icon using the extension's path and the provided icon name
        icon.set_gicon(Gio.icon_new_for_string(extensionInstance.path + "/icons/" + iconName + ".svg"));
    }

    // Update the monitor status icons
    _viewMonitors() {
        // Remove all existing icons
        this._mmStatusIcon.get_children().forEach(child => {
            this._mmStatusIcon.remove_child(child);
            child.destroy();
        });

        // Add a single icon for joined displays
        let icon = new St.Icon({
            style_class: 'system-status-icon multimonitor-status-icon'
        });
        this._icon_name(icon, 'joined-displays-symbolic'); // Use the 'joined-displays-symbolic' icon
        this._mmStatusIcon.add_child(icon);

        // Sync the visibility of the indicators
        this._syncIndicatorsVisible();
    }

    // Open the preferences dialog for the extension
    _onPreferences() {
        const uuid = "multi-monitor-panel@coolssor"; // Extension UUID
        Gio.DBus.session.call(
            'org.gnome.Shell.Extensions', // D-Bus service
            '/org/gnome/Shell/Extensions', // D-Bus object path
            'org.gnome.Shell.Extensions', // D-Bus interface
            'OpenExtensionPrefs', // Method to call
            new GLib.Variant('(ssa{sv})', [uuid, '', {}]), // Arguments for the method
            null, // No reply type
            Gio.DBusCallFlags.NONE, // No special flags
            -1, // Default timeout
            null // No cancellable object
        );
    }
};

// Register the class with GObject
GObject.registerClass(MultiMonitorIndicator);
// Define the MultiMonitorLayoutManager class
export class MultiMonitorLayoutManager {
    constructor() {
        // Get the desktop interface settings
        this._desktopSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface' });
    }
}