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

// Import necessary modules from GNOME Shell's UI and extensions framework
import * as Main from 'resource:///org/gnome/shell/ui/main.js'; // Provides access to GNOME Shell's main UI components
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'; // Base class for GNOME Shell extensions

// Import custom modules for layout and indicator functionality
import * as MMLayout from './mmlayout.js'; // Handles multi-monitor layout management
import * as MMIndicator from './indicator.js'; // Handles the status indicator for the extension

// Constant for the settings key that determines whether the indicator should be shown
const SHOW_INDICATOR_ID = 'show-indicator';

// Global variable to hold the current instance of the extension
export let extensionInstance = null;

// Main class for the Multi-monitor panel extension
export default class MultiMonitorPanelExtension extends Extension {
    constructor(metadata) {
        super(metadata); // Call the parent class constructor with metadata
        extensionInstance = this; // Store the current instance globally
    }

    // Toggles the visibility of the indicator based on the settings
    _toggleIndicator() {
        if (this._settings.get_boolean(SHOW_INDICATOR_ID)) // Check if the indicator should be shown
            this._showIndicator(); // Show the indicator
        else
            this._hideIndicator(); // Hide the indicator
    }

    // Adds the indicator to the GNOME Shell's status area
    _showIndicator() {
        if (this.mmIndicator) // If the indicator is already shown, do nothing
            return;
        // Create and add the indicator to the status area
        this.mmIndicator = Main.panel.addToStatusArea('MultiMonitorPanelExtension', new MMIndicator.MultiMonitorIndicator(this._settings));
    }

    // Removes the indicator from the GNOME Shell's status area
    _hideIndicator() {
        if (!this.mmIndicator) // If the indicator is not shown, do nothing
            return;
        this.mmIndicator.destroy(); // Destroy the indicator
        this.mmIndicator = null; // Clear the reference
    }

    // Called when the extension is enabled
    enable() {
        console.log(`Enabling ${this.metadata.name}`); // Log the enabling of the extension

        // If the extension is already enabled, disable it first
        if (Main.panel.statusArea.MultiMonitorPanelExtension)
            this.disable();

        // Initialize variables
        this.mmIndicator = null;
        this.mmLayoutManager = null;

        // Retrieve the extension's settings
        this._settings = this.getSettings();

        // Connect to the settings change signal for the indicator visibility
        this._toggleIndicatorId = this._settings.connect('changed::' + SHOW_INDICATOR_ID, this._toggleIndicator.bind(this));
        this._toggleIndicator(); // Set the initial state of the indicator

        // Initialize and show the multi-monitor layout manager
        this.mmLayoutManager = new MMLayout.MultiMonitorLayoutManager(this._settings);
        this.mmLayoutManager.showPanel();
    }

    // Called when the extension is disabled
    disable() {
        // Disconnect the settings change signal
        this._settings.disconnect(this._toggleIndicatorId);
        this._toggleIndicatorId = null;

        // Hide and clean up the indicator
        this._hideIndicator();
        this.mmIndicator = null;

        // Clear the settings reference
        this._settings = null;

        // Hide and clean up the multi-monitor layout manager
        this.mmLayoutManager.hidePanel();
        this.mmLayoutManager = null;

        console.log(`Disabled ${this.metadata.name} ...`); // Log the disabling of the extension
    }
}