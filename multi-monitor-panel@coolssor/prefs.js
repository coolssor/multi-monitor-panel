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

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export const SHOW_INDICATOR_ID = 'show-indicator';
export const SHOW_ACTIVITIES_ID = 'show-activities';
export const ENABLE_HOT_CORNERS = 'enable-hot-corners';

export var MultiMonitorPrefsWidget = GObject.registerClass(
    class MultiMonitorPrefsWidget extends Gtk.Grid {
        _init(p) {
            super._init({
                margin_top: 6, margin_end: 6, margin_bottom: 6, margin_start: 6
            });

            this._numRows = 0;

            this.set_orientation(Gtk.Orientation.VERTICAL);

            this._settings = p.getSettings();
            this._desktopSettings = p.getSettings("org.gnome.desktop.interface");

            this._display = Gdk.Display.get_default();
            this._monitors = this._display.get_monitors()

            this._addBooleanSwitch(_('Show extension indicator on top panel'), SHOW_INDICATOR_ID);
            this._addSettingsBooleanSwitch(_('Enable hot corners'), this._desktopSettings, ENABLE_HOT_CORNERS);
        }

        add(child) {
            this.attach(child, 0, this._numRows++, 1, 1);
        }

        _addComboBoxSwitch(label, schema_id, options) {
            this._addSettingsComboBoxSwitch(label, this._settings, schema_id, options)
        }

        _addSettingsComboBoxSwitch(label, settings, schema_id, options) {
            let gHBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                margin_top: 10, margin_end: 10, margin_bottom: 10, margin_start: 10,
                spacing: 20, hexpand: true
            });
            let gLabel = new Gtk.Label({ label: _(label), halign: Gtk.Align.START });
            gHBox.append(gLabel);

            let gCBox = new Gtk.ComboBoxText({ halign: Gtk.Align.END });
            Object.entries(options).forEach(function (entry) {
                const [key, val] = entry;
                gCBox.append(key, val);
            });
            gHBox.append(gCBox);

            this.add(gHBox);

            settings.bind(schema_id, gCBox, 'active-id', Gio.SettingsBindFlags.DEFAULT);
        }

        _addBooleanSwitch(label, schema_id) {
            this._addSettingsBooleanSwitch(label, this._settings, schema_id);
        }

        _addSettingsBooleanSwitch(label, settings, schema_id) {
            let gHBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                margin_top: 10, margin_end: 10, margin_bottom: 10, margin_start: 10,
                spacing: 20, hexpand: true
            });
            let gLabel = new Gtk.Label({ label: _(label), halign: Gtk.Align.START });
            gHBox.append(gLabel);
            let gSwitch = new Gtk.Switch({ halign: Gtk.Align.END });
            gHBox.append(gSwitch);
            this.add(gHBox);

            settings.bind(schema_id, gSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        }
    });

export default class MultiMonitorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        let page = new Adw.PreferencesPage();
        let group = new Adw.PreferencesGroup();

        let widget = new MultiMonitorPrefsWidget(this);
        group.add(widget);
        page.add(group);

        // Create a header bar using Adw.HeaderBar
        let headerBar = new Adw.HeaderBar({ title_widget: null });
        let menuButton = new Gtk.MenuButton({ valign: Gtk.Align.CENTER });
        let menuIcon = new Gtk.Image({ icon_name: 'open-menu-symbolic' }); // Use menu icon (3 lines)
        menuButton.set_child(menuIcon); // Set the icon as the child of the menu button
        let menuModel = new Gio.Menu();
        menuModel.append(_('About'), 'app.about');

        let popoverMenu = new Gtk.PopoverMenu({
            menu_model: menuModel,
        });
        menuButton.set_popover(popoverMenu);
        headerBar.pack_end(menuButton);

        // Handle "About" menu action
        let actionGroup = new Gio.SimpleActionGroup();
        let aboutAction = new Gio.SimpleAction({ name: 'about' });
        aboutAction.connect('activate', () => {
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
            secondary_use_markup: true,
            });

            let githubButton = aboutDialog.add_button(_('GitHub'), Gtk.ResponseType.NONE);
            githubButton.connect('clicked', () => {
            Gio.AppInfo.launch_default_for_uri('https://github.com/coolssor/multi-monitor-panel', null);
            });

            aboutDialog.connect('response', () => aboutDialog.destroy());
            aboutDialog.show();
        });
        actionGroup.add_action(aboutAction);
        window.insert_action_group('app', actionGroup);

        // Add the header bar to the top of the preferences page
        let mainBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
        });
        mainBox.append(headerBar);
        mainBox.append(page);

        // Add the main box to the window
        window.set_content(mainBox);
    }
}
