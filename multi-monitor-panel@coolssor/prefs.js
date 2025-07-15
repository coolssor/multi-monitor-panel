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

// Import necessary libraries and modules
import Adw from 'gi://Adw'; // For creating modern GNOME application widgets
import GObject from 'gi://GObject'; // For object-oriented programming in GNOME
import Gdk from 'gi://Gdk'; // For interacting with the display and monitors
import Gtk from 'gi://Gtk'; // For creating graphical user interfaces
import Gio from 'gi://Gio'; // For settings and application actions

// Import base class and translation function from GNOME Shell Extensions
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// Define constants for settings keys
export const SHOW_INDICATOR_ID = 'show-indicator'; // Key for showing the extension indicator
export const SHOW_ACTIVITIES_ID = 'show-activities'; // Key for showing activities
export const ENABLE_HOT_CORNERS = 'enable-hot-corners'; // Key for enabling hot corners

// Define a custom widget for the preferences window
export var MultiMonitorPrefsWidget = GObject.registerClass(
    class MultiMonitorPrefsWidget extends Gtk.Grid {
        _init(p) {
            // Initialize the widget with margins and vertical orientation
            super._init({
                margin_top: 6, margin_end: 6, margin_bottom: 6, margin_start: 6
            });

            this._numRows = 0; // Track the number of rows in the grid

            this.set_orientation(Gtk.Orientation.VERTICAL); // Set the layout to vertical

            // Get the settings for the extension and GNOME desktop interface
            this._settings = p.getSettings();
            this._desktopSettings = p.getSettings("org.gnome.desktop.interface");

            // Get the display and monitor information
            this._display = Gdk.Display.get_default();
            this._monitors = this._display.get_monitors();

            // Add switches for user preferences
            this._addBooleanSwitch(_('Show extension indicator on top panel'), SHOW_INDICATOR_ID);
            this._addSettingsBooleanSwitch(_('Enable hot corners'), this._desktopSettings, ENABLE_HOT_CORNERS);
        }

        // Add a child widget to the grid
        add(child) {
            this.attach(child, 0, this._numRows++, 1, 1);
        }

        // Add a combo box (dropdown) for selecting options
        _addComboBoxSwitch(label, schema_id, options) {
            this._addSettingsComboBoxSwitch(label, this._settings, schema_id, options);
        }

        // Add a combo box bound to a settings key
        _addSettingsComboBoxSwitch(label, settings, schema_id, options) {
            let gHBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                margin_top: 10, margin_end: 10, margin_bottom: 10, margin_start: 10,
                spacing: 20, hexpand: true
            });
            let gLabel = new Gtk.Label({ label: _(label), halign: Gtk.Align.START }); // Label for the combo box
            gHBox.append(gLabel);

            let gCBox = new Gtk.ComboBoxText({ halign: Gtk.Align.END }); // Combo box widget
            Object.entries(options).forEach(function (entry) {
                const [key, val] = entry;
                gCBox.append(key, val); // Add options to the combo box
            });
            gHBox.append(gCBox);

            this.add(gHBox); // Add the combo box to the grid

            // Bind the combo box to the settings key
            settings.bind(schema_id, gCBox, 'active-id', Gio.SettingsBindFlags.DEFAULT);
        }

        // Add a boolean switch for a preference
        _addBooleanSwitch(label, schema_id) {
            this._addSettingsBooleanSwitch(label, this._settings, schema_id);
        }

        // Add a boolean switch bound to a settings key
        _addSettingsBooleanSwitch(label, settings, schema_id) {
            let gHBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                margin_top: 10, margin_end: 10, margin_bottom: 10, margin_start: 10,
                spacing: 20, hexpand: true
            });
            let gLabel = new Gtk.Label({ label: _(label), halign: Gtk.Align.START }); // Label for the switch
            gHBox.append(gLabel);
            let gSwitch = new Gtk.Switch({ halign: Gtk.Align.END }); // Switch widget
            gHBox.append(gSwitch);
            this.add(gHBox); // Add the switch to the grid

            // Bind the switch to the settings key
            settings.bind(schema_id, gSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        }
    });

// Define the main preferences class for the extension
export default class MultiMonitorPreferences extends ExtensionPreferences {
    // Fill the preferences window with content
    fillPreferencesWindow(window) {
        window._settings = this.getSettings(); // Get the extension settings

        let page = new Adw.PreferencesPage(); // Create a new preferences page
        let group = new Adw.PreferencesGroup(); // Create a group for related settings

        let widget = new MultiMonitorPrefsWidget(this); // Create the custom widget
        group.add(widget); // Add the widget to the group
        page.add(group); // Add the group to the page

        // Create a header bar using Adw.HeaderBar
        let headerBar = new Adw.HeaderBar({ title_widget: null }); // Header bar for the preferences window
        let menuButton = new Gtk.MenuButton({ valign: Gtk.Align.CENTER }); // Menu button for additional actions
        let menuIcon = new Gtk.Image({ icon_name: 'open-menu-symbolic' }); // Use menu icon (3 lines)
        menuButton.set_child(menuIcon); // Set the icon as the child of the menu button
        let menuModel = new Gio.Menu(); // Create a menu model
        menuModel.append(_('About'), 'app.about'); // Add an "About" menu item

        let popoverMenu = new Gtk.PopoverMenu({
            menu_model: menuModel, // Attach the menu model to the popover
        });
        menuButton.set_popover(popoverMenu); // Set the popover for the menu button
        headerBar.pack_end(menuButton); // Add the menu button to the header bar

        // Handle "About" menu action
        let actionGroup = new Gio.SimpleActionGroup(); // Create an action group
        let aboutAction = new Gio.SimpleAction({ name: 'about' }); // Define the "About" action
        aboutAction.connect('activate', () => {
            // Show an "About" dialog when the action is activated
            let aboutDialog = new Gtk.MessageDialog({
                transient_for: window,
                modal: true,
                buttons: Gtk.ButtonsType.OK,
                text: _('About Multi-monitor panel'),
                secondary_text: _(
                    'Underdeveloped by coolssor.\n\n' +
                    'Credit for the majority of the work goes to ' +
                    '<a href="https://github.com/lazanet/multi-monitors-add-on">lazanet</a>, ' +
                    '<a href="https://github.com/spin83/multi-monitors-add-on">spin83</a>, and ' +
                    '<a href="https://github.com/darkxst/multiple-monitor-panels">darkxst</a>.\n\n' +
                    'Version: 1.2\n\n' +
                    'Thank you for using this extension!'
                ),
                secondary_use_markup: true, // Enable markup for links in the secondary text
            });

            // Add a "GitHub" button to the dialog
            let githubButton = aboutDialog.add_button(_('GitHub'), Gtk.ResponseType.NONE);
            githubButton.connect('clicked', () => {
                // Open the GitHub page when the button is clicked
                Gio.AppInfo.launch_default_for_uri('https://github.com/coolssor/multi-monitor-panel', null);
            });

            // Destroy the dialog when it is closed
            aboutDialog.connect('response', () => aboutDialog.destroy());
            aboutDialog.show(); // Show the dialog
        });
        actionGroup.add_action(aboutAction); // Add the "About" action to the action group
        window.insert_action_group('app', actionGroup); // Insert the action group into the window

        // Add the header bar to the top of the preferences page
        let mainBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10, // Add spacing between elements
        });
        mainBox.append(headerBar); // Add the header bar to the main box
        mainBox.append(page); // Add the preferences page to the main box

        // Add the main box to the window
        window.set_content(mainBox);
    }
}
